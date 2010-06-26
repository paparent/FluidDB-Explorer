import os
import tornado.web
import tornado.wsgi
import wsgiref.handlers

from tornado.escape import json_encode, json_decode

from fom.session import Fluid
from fom.db import PRIMITIVE_CONTENT_TYPE
import fom.errors

import gmemsess


class MainHandler(tornado.web.RequestHandler):
    def get(self, rootns):
        sess = gmemsess.Session(self)
        try:
            username = sess['username']
        except KeyError:
            username = sess['username'] = 'Anonymous'
            sess.save()

        sess['instance'] = 'main'
        sess['base_url'] = 'http://fluiddb.fluidinfo.com'
        sess['rootns'] = rootns or ''
        sess.save()

        rootlabel = rootns or 'FluidDB'
        html = self.render_string("index.html", username=username,
            rootlabel=rootlabel, rootid=(rootns or 'fdbexplorer-id-root'))
        self.write(html)


class SandboxHandler(tornado.web.RequestHandler):
    def get(self, rootns):
        sess = gmemsess.Session(self)
        try:
            username = sess['username']
        except KeyError:
            username = sess['username'] = 'Anonymous'
            sess.save()

        sess['instance'] = 'sandbox'
        sess['base_url'] = 'http://sandbox.fluidinfo.com'
        sess['rootns'] = rootns or ''
        sess.save()

        rootlabel = rootns or 'FluidDB'
        html = self.render_string("index.html", username=username,
            rootlabel=rootlabel, rootid=(rootns or 'fdbexplorer-id-root'))
        self.write(html)


class RemoteHandler(tornado.web.RequestHandler):
    def post(self, action):
        sess = gmemsess.Session(self)
        try:
            base_url = sess['base_url']
        except KeyError:
            base_url = 'http://fluiddb.fluidinfo.com'

        fluid = Fluid(base_url)

        try:
            sess_username = sess['username']
            sess_password = sess['password']
            fluid.login(sess_username, sess_password)
        except KeyError:
            pass

        if action == 'namespacesfetch':
            namespace = self.get_argument('node')
            if namespace == 'fdbexplorer-id-root':
                try:
                    rootns = sess['rootns']
                    namespace = rootns
                    if rootns == '':
                        path = ''
                    else:
                        path = rootns + '/'
                except KeyError:
                    namespace = path = rootns = ''
            else:
                path = namespace + '/'

            response = fluid.namespaces[namespace].get(returnNamespaces=True,
                returnTags=True)

            out = []
            for nss in response.value['namespaceNames']:
                out.append({'id': path + nss, 'leaf': False, 'text': nss})
            for tag in response.value['tagNames']:
                out.append({'id': path + tag, 'leaf': True, 'text': tag})
            self.write(json_encode(out))

        elif action == 'query':
            querystr = self.get_argument('query')
            response = fluid.objects.get(querystr)
            ids = response.value['ids']

            out = []
            if len(ids) > 30:
                showAbout = False
            else:
                showAbout = True
            for objid in ids:
                if showAbout:
                    try:
                        about = \
                            fluid.objects[objid]['fluiddb/about'].get().value
                    except fom.errors.Fluid404Error:
                        about = 'no about tag'
                else:
                    about = '<em>too many objects (more than 30) to fetch ' \
                            'about tag</em>'
                out.append({'oid': objid, 'about': about})
            self.write(json_encode({'ids': out}))

        elif action == 'tagvaluesfetch':
            oid = self.get_argument('oid')
            response = fluid.objects[oid].get()
            out = []
            k = 0
            tags = response.value['tagPaths']
            if len(tags) > 10:
                showTagValue = False
            else:
                showTagValue = True
            for tag in tags:
                k = k + 1
                if k == 200:
                    break
                if showTagValue:
                    tagresponse = fluid.objects[oid][tag].get()
                    if tagresponse.content_type == PRIMITIVE_CONTENT_TYPE:
                        value = str(tagresponse.value)
                    else:
                        value = '<em>(Opaque value)</em>'
                else:
                    value = "<em>Too many tags to fetch values</em>"

                out.append({'tag': tag, 'value': value})
            self.write(json_encode({'tags': out}))

        elif action == 'gettagvalue':
            try:
                oid = self.get_argument('oid')
                tag = self.get_argument('tag')
                tagresponse = fluid.objects[oid][tag].get()
                if tagresponse.content_type == PRIMITIVE_CONTENT_TYPE:
                    value = str(tagresponse.value)
                else:
                    value = '<em>(Opaque value)</em>'
                self.write(value)
            except:
                self.write("")

        elif action == 'tagobject':
            try:
                oid = self.get_argument('oid')
                tag = self.get_argument('tag')
                value = self.get_argument('value')
                fluid.objects[oid][tag].put(value)
                self.write("{success:true}")
            except:
                self.write("{success:false}")

        elif action == 'createnamespace':
            try:
                path = self.get_argument('path')
                namespace = self.get_argument('namespace')
                description = self.get_argument('description')
                fluid.namespaces[path].post(namespace, description)
                self.write("{success:true}")
            except:
                self.write("{success:false}")

        elif action == 'deletenamespace':
            try:
                namespace = self.get_argument('namespace')
                fluid.namespaces[namespace].delete()
                self.write("{success:true}")
            except:
                self.write("{success:false}")

        elif action == 'createtag':
            try:
                path = self.get_argument('path')
                tag = self.get_argument('tag')
                description = self.get_argument('description')
                fluid.tags[path].post(tag, description, False)
                self.write("{success:true}")
            except:
                self.write("{success:false}")

        elif action == 'deletetag':
            try:
                tag = self.get_argument('tag')
                fluid.tags[tag].delete()
                self.write("{success:true}")
            except:
                self.write("{success:false}")

        elif action == 'login':
            sess['logged'] = True
            sess['username'] = self.get_argument('username')
            sess['password'] = self.get_argument('password')
            sess.save()
            self.write("{success:true}")

        elif action == 'logout':
            sess.invalidate()

        elif action == 'changeinstance':
            sess['baseurl'] = self.get_argument('baseurl')


settings = {
        "static_path": os.path.join(os.path.dirname(__file__), "static"),
        "template_path": os.path.join(os.path.dirname(__file__), "templates"),
        "xsrf_cookies": True,
        "gzip": True,
        "debug": os.environ.get("SERVER_SOFTWARE", "")
            .startswith("Development/"),
        }

application = tornado.wsgi.WSGIApplication([
    (r"/remote/(.+)", RemoteHandler),
    (r"/sandbox/remote/(.+)", RemoteHandler),
    (r"/sandbox/(.*)", SandboxHandler),
    (r"/(.*)", MainHandler),
    ], **settings)


def real_main():
    wsgiref.handlers.CGIHandler().run(application)


def profile_main():
    # This is the main function for profiling
    # We've renamed our original main() above to real_main()
    import cProfile
    import pstats
    import StringIO
    import logging
    prof = cProfile.Profile()
    prof = prof.runctx("real_main()", globals(), locals())
    stream = StringIO.StringIO()
    stats = pstats.Stats(prof, stream=stream)
    stats.sort_stats("time")  # Or cumulative
    stats.print_stats(80)  # 80 = how many to print
    # The rest is optional.
    # stats.print_callees()
    # stats.print_callers()
    logging.info("Profile data:\n%s",
    stream.getvalue())

main = real_main

if __name__ == "__main__":
    main()
