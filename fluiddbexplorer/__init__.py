# -*- coding: utf-8 -*-
"""
    fluiddbexplorer
    ~~~~~~~~~~~~~~~

    :copyright: 2010 by FluidDB Explorer Authors
    :license: MIT, see LICENSE for more information
"""

from flask import Flask, abort, redirect, render_template, session, url_for

from flaskext.extdirect import ExtDirect
from fluiddbexplorer import local_settings

app = Flask(__name__)
app.config.from_object(local_settings)
extdirect = ExtDirect(app)


from fluiddbexplorer import direct


@app.route('/favicon.ico/')
def favicon():
    abort(404)


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
        session['instance'] = instance
        return render_template("index.html",
                               username=username,
                               rootlabel='FluidDB',
                               instance=instance,
                               rootid='nstree-disabled')


@app.route('/<instance>/<path:rootns>')
def main(instance, rootns):
    session['instance'] = instance
    rootns = rootns.rstrip('/')
    return render_template("index.html",
                           username=session.get('username', 'Anonymous'),
                           rootlabel=rootns,
                           instance=instance,
                           rootid=(rootns or 'nstree-disabled'))
