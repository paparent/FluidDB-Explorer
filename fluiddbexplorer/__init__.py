# -*- coding: utf-8 -*-
"""
fluiddbexplorer
~~~~~~~~~~~~~~~

:copyright: 2010 by FluidDB Explorer Authors
:license: MIT, see LICENSE for more information
"""

from flask import Flask, json, redirect, render_template, request, \
                  session, url_for

from fom.session import Fluid
from fom.db import PRIMITIVE_CONTENT_TYPE
from fom.errors import FluidError

from fluiddbexplorer import local_settings

app = Flask(__name__)
app.config.from_object(local_settings)


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


@app.route('/')
def index():
    username = session.get('username', 'Anonymous')
    if username == 'Anonymous':
        return redirect(url_for('splash', instance='fluiddb'))
    else:
        return redirect(url_for('main', instance='fluiddb', rootns=username))


@app.route('/<instance>/')
def splash(instance):
    username = session.get('username', 'Anonymous')
    if username != 'Anonymous':
        return redirect(url_for('main', instance=instance, rootns=username))
    else:
        return render_template("index.html",
                               username=username,
                               rootlabel='FluidDB',
                               instance=instance,
                               rootid='nstree-disabled')


@app.route('/<instance>/<path:rootns>')
def main(instance, rootns):
    rootns = rootns.rstrip('/')
    return render_template("index.html",
                           username=session.get('username', 'Anonymous'),
                           rootlabel=rootns,
                           instance=instance,
                           rootid=(rootns or 'nstree-disabled'))


@app.route('/remote/<instance>/<action>', methods=['POST'])
def remote(instance, action):
    fluid = Fluid(get_instance_url(instance))

    try:
        sess_username = session['username']
        sess_password = session['password']
        fluid.login(sess_username, sess_password)
    except KeyError:
        pass

    if action == 'namespacesfetch':
        # TODO: output as dict and handle 401 Error
        namespace = request.form.get('node', '')
        path = namespace + '/'

        response = fluid.namespaces[namespace].get(returnNamespaces=True,
                                                   returnTags=True)

        out = []
        for nss in response.value['namespaceNames']:
            out.append({'id': path + nss, 'leaf': False, 'text': nss})
        for tag in response.value['tagNames']:
            out.append({'id': path + tag, 'leaf': True, 'text': tag})
        return json.dumps(out)

    elif action == 'query':
        querystr = request.form.get('query', '')
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
        return json.dumps({'ids': out})

    elif action == 'tagvaluesfetch':
        oid = request.form.get('oid', '')
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
        return json.dumps({'tags': out})

    elif action == 'gettagvalue':
        try:
            readonly = True
            oid = request.form.get('oid', '')
            tag = request.form.get('tag', '')
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
            return json.dumps({'success': True, 'type': type, 'value': value,
                             'readonly': readonly})
        except:
            return json.dumps({'success': False})

    elif action == 'tagobject':
        try:
            oid = request.form.get('oid')
            tag = request.form.get('tag')
            value = request.form.get('value', None)
            fluid.objects[oid][tag].put(value)
            return json.dumps({"success": True})
        except FluidError, e:
#            self.set_status(e.status)
            return json.dumps({"success": False, "msg": e.http_error})

    elif action == 'deletetagvalue':
        try:
            oid = request.form.get('oid')
            tag = request.form.get('tag')
            fluid.objects[oid][tag].delete()
            return json.dumps({"success": True})
        except FluidError, e:
#            self.set_status(e.status)
            return json.dumps({"success": False, "msg": e.http_error})

    elif action == 'createnamespace':
        try:
            path = request.form.get('path')
            namespace = request.form.get('namespace')
            description = request.form.get('description')
            fluid.namespaces[path].post(namespace, description)
            return json.dumps({"success": True})
        except FluidError, e:
#            self.set_status(e.status)
            return json.dumps({"success": False, "msg": e.http_error})

    elif action == 'deletenamespace':
        try:
            namespace = request.form.get('namespace')
            fluid.namespaces[namespace].delete()
            return json.dumps({"success": True})
        except FluidError, e:
#            self.set_status(e.status)
            return json.dumps({"success": False, "msg": e.http_error})

    elif action == 'createtag':
        try:
            path = request.form.get('path')
            tag = request.form.get('tag')
            description = request.form.get('description')
            fluid.tags[path].post(tag, description, False)
            return json.dumps({"success": True})
        except FluidError, e:
#            self.set_status(e.status)
            return json.dumps({"success": False, "msg": e.http_error})

    elif action == 'deletetag':
        try:
            tag = request.form.get('tag')
            fluid.tags[tag].delete()
            return json.dumps({"success": True})
        except FluidError, e:
#            self.set_status(e.status)
            return json.dumps({"success": False, "msg": e.http_error})

    elif action == 'getperm':
        try:
            type = request.form.get('type')
            action = request.form.get('action')
            path = request.form.get('path')
            if type == 'ns':
                response = fluid.permissions.namespaces[path].get(action).value
            else:
                response = fluid.permissions.tag_values[path].get(action).value
            return json.dumps(response)
        except:
            return

    elif action == 'setperm':
        try:
            type = request.form.get('type')
            action = request.form.get('action')
            path = request.form.get('path')
            policy = request.form.get('policy')
            exceptions = json.loads(request.form.get('exceptions'))
            if type == 'ns':
                response = fluid.permissions.namespaces[path].put(action,
                                                                  policy,
                                                                  exceptions)
            else:
                response = fluid.permissions.tag_values[path].put(action,
                                                                  policy,
                                                                  exceptions)
            return json.dumps(response)
        except:
            return

    elif action == 'login':
        session['logged'] = True
        session['username'] = request.form.get('username')
        session['password'] = request.form.get('password')
        return json.dumps({"success": True})

    elif action == 'logout':
        session.pop('logged', None)
        session.pop('username', None)
        session.pop('password', None)
        return json.dumps({"success": True})
