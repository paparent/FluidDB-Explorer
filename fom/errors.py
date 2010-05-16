# -*- coding: utf-8 -*-

"""
    fom.errors
    ~~~~~~~~~~

    Exception mechanisms for handlinng failed requests to FluidDB

    :copyright: 2009-2010 Fom Authors.
    :license: MIT, see LICENSE for more information.
"""


class FluidError(Exception):

    http_error = None

    def __init__(self, response):
        Exception.__init__(self, response)
        self.status = response.status
        self.fluid_error = response.error

    def __str__(self):
        return '<%s (%s %s)>' % (self.fluid_error, self.status,
                                 self.http_error)


class Fluid400Error(FluidError):

    http_error = 'Bad Request'


class Fluid401Error(FluidError):

    http_error = 'Unauthorized'


class Fluid404Error(FluidError):

    http_error = 'Not Found'


class Fluid406Error(FluidError):

    http_error = 'Not Acceptable'


class Fluid412Error(FluidError):

    http_error = 'Precondition Failed'


class Fluid413Error(FluidError):

    http_error = 'Request Entity Too Large'


class Fluid500Error(FluidError):

    http_error = 'Internal Server Error'


errors = {
    400: Fluid400Error,
    401: Fluid401Error,
    404: Fluid404Error,
    406: Fluid406Error,
    412: Fluid412Error,
    413: Fluid413Error,
    500: Fluid500Error,
}

def raise_error(response):
    raise errors[response.status](response)
