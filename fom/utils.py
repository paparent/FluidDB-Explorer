# -*- coding: utf-8 -*-

"""
    fom.utils
    ~~~~~~~~~

    Additional utilities for Fom.

    :copyright: 2009-2010 Fom Authors.
    :license: MIT, see LICENSE for more information.

    Inspiration from flask.signals (Armin Ronacher)
"""

try:
    from blinker import Namespace
except ImportError:
    Namespace = None


class _DummySignal(object):
    """A fake signal which complains when it is used and noops when it is
    fired.
    """
    def __init__(self, name, doc=None):
        self.name = name
        self.__doc__ = doc

    def connect(self, *args, **kwargs):
        raise RuntimeError('signalling support is unavailable '
                           'because the blinker library is '
                           'not installed.')

    def send(self, *args, **kw):
        pass # genuine noop


class _DummyNamespace(object):
    """An interface-compatible namespace
    """
    def signal(self, name, doc=None):
        return _DummySignal(name, doc)


if Namespace is None:
    Namespace = _DummyNamespace


# Fom's signals
fom_signals = Namespace()

fom_request_sent = fom_signals.signal('request-sent', doc="""
Signal sent before each request has been sent to fluiddb""")

fom_response_received = fom_signals.signal('response-received', doc="""
Signal sent on receipt of a response from fluiddb, before any response checking
has taken place""")


