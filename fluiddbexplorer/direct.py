# -*- coding: utf-8 -*-
"""
fluiddbexplorer.direct
~~~~~~~~~~~~~~~~~~~~~~

Ext.Direct functions

:copyright: 2010 by FluidDB Explorer Authors
:license: MIT, see LICENSE for more information
"""

from flask import g, session
from fom.session import Fluid
from fom.db import PRIMITIVE_CONTENT_TYPE

from fluiddbexplorer import extdirect


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


@extdirect.app.before_request
def setup_fluid():
    instance = session.get('instance', 'fluiddb')
    g.fluid = Fluid(get_instance_url(instance))

@extdirect.before_request
def setup_login():
    try:
        sess_username = session['username']
        sess_password = session['password']
        g.fluid.login(sess_username, sess_password)
    except KeyError:
        pass

@extdirect.register()
def NamespacesFetch(namespace):
    path = namespace + '/'

    response = g.fluid.namespaces[namespace].get(returnNamespaces=True,
                                               returnTags=True)

    out = []
    for nss in response.value['namespaceNames']:
        out.append({'id': path + nss, 'leaf': False, 'text': nss})
    for tag in response.value['tagNames']:
        out.append({'id': path + tag, 'leaf': True, 'text': tag})
    return out

@extdirect.register()
def Query(querystr):
    response = g.fluid.values.get(querystr, ('fluiddb/about',))
    ids = response.value['results']['id']

    out = []
    for objid in ids:
        try:
            about = ids[objid]['fluiddb/about']['value']
        except KeyError:
            about = 'no about tag'
        out.append({'oid': objid, 'about': about})
    return {'ids': out}

@extdirect.register()
def TagValuesFetch(oid):
    response = g.fluid.objects[oid].get()
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
                tagresponse = g.fluid.objects[oid][tag].get()
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
    return {'tags': out}


@extdirect.register()
def GetTagValue(oid, tag):
    readonly = True
    tagresponse = g.fluid.objects[oid][tag].get()
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
    return {'type': type, 'value': value, 'readonly': readonly}


@extdirect.register()
def TagObject(oid, tag, value):
    g.fluid.objects[oid][tag].put(value)

@extdirect.register()
def DeleteTagValue(oid, tag):
    g.fluid.objects[oid][tag].delete()

@extdirect.register()
def CreateNamespace(path, namespace, description):
    g.fluid.namespaces[path].post(namespace, description)

@extdirect.register()
def DeleteNamespace(namespace):
    g.fluid.namespaces[namespace].delete()

@extdirect.register()
def CreateTag(path, tag, description):
    g.fluid.tags[path].post(tag, description, False)

@extdirect.register()
def DeleteTag(tag):
    g.fluid.tags[tag].delete()

@extdirect.register()
def GetPerm(type, action, path):
    if type == 'ns':
        response = g.fluid.permissions.namespaces[path].get(action).value
    else:
        response = g.fluid.permissions.tag_values[path].get(action).value
    return response

@extdirect.register()
def SetPerm(type, action, path, policy, exceptions):
    if type == 'ns':
        g.fluid.permissions.namespaces[path].put(action,
                                               policy,
                                               exceptions)
    else:
        g.fluid.permissions.tag_values[path].put(action,
                                               policy,
                                               exceptions)

@extdirect.register(flags={'formHandler': True})
def Login(username, password):
    session['logged'] = True
    session['username'] = username
    session['password'] = password
    return {'success': True}

@extdirect.register()
def Logout():
    session.pop('logged', None)
    session.pop('username', None)
    session.pop('password', None)
