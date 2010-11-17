import os
import tornado.web
import tornado.wsgi
import wsgiref.handlers

from tornado.escape import json_encode, json_decode

from fom.session import Fluid
from fom.db import PRIMITIVE_CONTENT_TYPE
from fom.errors import FluidError, Fluid404Error

import gmemsess


INSTANCE_URL = {
    'fluiddb': 'http://fluiddb.fluidinfo.com',
    'sandbox': 'http://sandbox.fluidinfo.com',
}


def get_instance_url(instance):
    try:
        url = INSTANCE_URL[instance]
    except KeyError:
        url = 'http://' + instance
    return url


class BaseHandler(tornado.web.RequestHandler):
    def prepare(self):
        self.session = gmemsess.Session(self)
        try:
            self.username = self.session['username']
        except KeyError:
            self.username = self.session['username'] = 'Anonymous'
            self.session.save()

    def render_main(self, instance, rootns):
        rootlabel = rootns or 'FluidDB'
        self.render("index.html",
            username=self.username,
            rootlabel=rootlabel,
            instance=instance,
            rootid=(rootns or 'nstree-disabled')
        )


class MainHandler(BaseHandler):
    def get(self):
        if self.username == 'Anonymous':
            self.redirect("/fluiddb/")
        else:
            self.redirect("/fluiddb/%s/" % self.username)


class InstanceHandler(BaseHandler):
    @tornado.web.addslash
    def get(self, instance, rootns):
        rootns = rootns.rstrip('/')
        if rootns == "" and self.username != 'Anonymous':
            self.redirect("/%s/%s/" % (instance, self.username))
        else:
            self.session['base_url'] = get_instance_url(instance)
            self.session.save()
            self.render_main(instance, rootns)


class RemoteHandler(BaseHandler):
    def post(self, instance, action):
        fluid = Fluid(get_instance_url(instance))

        try:
            sess_username = self.session['username']
            sess_password = self.session['password']
            fluid.login(sess_username, sess_password)
        except KeyError:
            pass

        if action == 'namespacesfetch':
            # TODO: output as dict and handle 401 Error
            namespace = self.get_argument('node')
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
            response = fluid.values.get(querystr, ('fluiddb/about',))
            ids = response.value['results']

            # TODO: Actually, the results could be passed right away.
            out = []
            for objid in ids:
                try:
                    about = ids[objid]['fluiddb/about']['value']
                except KeyError:
                    about = 'no about tag'
                out.append({'oid': objid, 'about': about})
            self.write({'ids': out})

        elif action == 'tagvaluesfetch':
            oid = self.get_argument('oid')
            response = fluid.objects[oid].get()
            out = []
            k = 0
            tags = response.value['tagPaths']
            showTagValue = False if len(tags) > 10 else True
            for tag in tags:
                k = k + 1
                if k == 200:
                    break
                readonly = True
                if showTagValue:
                    try:
                        tagresponse = fluid.objects[oid][tag].get()
                        if tagresponse.content_type.startswith(PRIMITIVE_CONTENT_TYPE):
                            value = str(tagresponse.value)
                            readonly = False
                        else:
                            value = '(Opaque value)'
                    except:
                        value = '...request error...'
                else:
                    value = "Too many tags to fetch values"

                out.append({'tag': tag, 'value': value, 'readonly': readonly})
            self.write({'tags': out})

        elif action == 'gettagvalue':
            try:
                readonly = True
                oid = self.get_argument('oid')
                tag = self.get_argument('tag')
                tagresponse = fluid.objects[oid][tag].get()
                if tagresponse.content_type.startswith(PRIMITIVE_CONTENT_TYPE):
                    if tagresponse.value is None:
                        type = 'empty'
                        value = 'Empty'
                        readonly = False
                    else:
                        type = 'primitive'
                        value = str(tagresponse.value)
                        readonly = False
                else:
                    type = 'opaque'
                    value = tagresponse.content_type
                self.write({'success':True, 'type':type, 'value':value,
                    'readonly': readonly})
            except:
                self.write({'success':False})

        elif action == 'tagobject':
            try:
                oid = self.get_argument('oid')
                tag = self.get_argument('tag')
                value = self.get_argument('value', default=None)
                fluid.objects[oid][tag].put(value)
                self.write({"success": True})
            except FluidError, e:
                self.set_status(e.status)
                self.write({"success": False, "msg": e.http_error})

        elif action == 'deletetagvalue':
            try:
                oid = self.get_argument('oid')
                tag = self.get_argument('tag')
                fluid.objects[oid][tag].delete()
                self.write({"success": True})
            except FluidError, e:
                self.set_status(e.status)
                self.write({"success": False, "msg": e.http_error})

        elif action == 'createnamespace':
            try:
                path = self.get_argument('path')
                namespace = self.get_argument('namespace')
                description = self.get_argument('description')
                fluid.namespaces[path].post(namespace, description)
                self.write({"success": True})
            except FluidError, e:
                self.set_status(e.status)
                self.write({"success": False, "msg": e.http_error})

        elif action == 'deletenamespace':
            try:
                namespace = self.get_argument('namespace')
                fluid.namespaces[namespace].delete()
                self.write({"success": True})
            except FluidError, e:
                self.set_status(e.status)
                self.write({"success": False, "msg": e.http_error})

        elif action == 'createtag':
            try:
                path = self.get_argument('path')
                tag = self.get_argument('tag')
                description = self.get_argument('description')
                fluid.tags[path].post(tag, description, False)
                self.write({"success": True})
            except FluidError, e:
                self.set_status(e.status)
                self.write({"success": False, "msg": e.http_error})

        elif action == 'deletetag':
            try:
                tag = self.get_argument('tag')
                fluid.tags[tag].delete()
                self.write({"success": True})
            except FluidError, e:
                self.set_status(e.status)
                self.write({"success": False, "msg": e.http_error})

        elif action == 'getperm':
            try:
                type = self.get_argument('type')
                action = self.get_argument('action')
                path = self.get_argument('path')
                if type == 'ns':
                    response = fluid.permissions.namespaces[path].get(action).value
                else:
                    response = fluid.permissions.tag_values[path].get(action).value
                self.write(json_encode(response))
            except:
                self.write("")

        elif action == 'setperm':
            try:
                type = self.get_argument('type')
                action = self.get_argument('action')
                path = self.get_argument('path')
                policy = self.get_argument('policy')
                exceptions = json_decode(self.get_argument('exceptions'))
                if type == 'ns':
                    response = fluid.permissions.namespaces[path].put(action,
                            policy, exceptions)
                else:
                    response = fluid.permissions.tag_values[path].put(action,
                            policy, exceptions)
                self.write(json_encode(response))
            except:
                self.write("")

        elif action == 'login':
            self.session['logged'] = True
            self.session['username'] = self.get_argument('username')
            self.session['password'] = self.get_argument('password')
            self.session.save()
            self.write({"success": True})

        elif action == 'logout':
            self.session.invalidate()
            self.write({"success": True})


settings = {
        "static_path": os.path.join(os.path.dirname(__file__), "static"),
        "template_path": os.path.join(os.path.dirname(__file__), "templates"),
        "xsrf_cookies": True,
        "gzip": True,
        "debug": os.environ.get("SERVER_SOFTWARE", "")
            .startswith("Development/"),
        }

application = tornado.wsgi.WSGIApplication([
    (r"/remote/([a-z0-9\.]+)/(.+)", RemoteHandler),
    (r"/([a-z0-9\.]+)/?(.*)", InstanceHandler),
    (r"/", MainHandler),
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
