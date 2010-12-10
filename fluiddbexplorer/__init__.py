# -*- coding: utf-8 -*-
"""
    fluiddbexplorer
    ~~~~~~~~~~~~~~~

    :copyright: 2010 by FluidDB Explorer Authors
    :license: MIT, see LICENSE for more information
"""

from flask import Flask, redirect, render_template, session, url_for

from flaskext.extdirect import ExtDirect
from fluiddbexplorer import local_settings

app = Flask(__name__)
app.config.from_object(local_settings)
extdirect = ExtDirect(app)


from fluiddbexplorer import direct


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
