# -*- coding: utf-8 -*-

"""
    fom.session
    ~~~~~~~~~~~

    Combining a db instance with an API.

    :copyright: 2009-2010 Fom Authors.
    :license: MIT, see LICENSE for more information.
"""

from fom.api import FluidApi
from fom.db import FluidDB, BASE_URL


class Fluid(FluidApi):
    """A fluiddb session.

    :param base_url: The base FluidDB url to use. Currently, this can only be
        either the main FluidDB instance, or the sandbox instance.
    """

    def __init__(self, base_url=BASE_URL):
        FluidApi.__init__(self, FluidDB(base_url))

    def bind(self):
        """Bind this instance of the session to the global object mapper

        This is a convenience to allow declaring mapped objects that are bound
        to this session without requiring passing the session to each created
        object.

        >>> fdb = Fluid()
        >>> fdb.bind()
        >>> from fom.mapper import Object
        >>> o = Object() # this is bound to the fdb instance
        """
        # this is particularly nasty
        Fluid.bound = self

    def login(self, username, password):
        """Log in to the connected FluidDB

        The login is maintained for the session until :meth:`~Fluid.logout`
        is called.

        >>> fdb = Fluid()
        >>> fdb.login(u'test', u'test')
        >>> fdb.users.get(u'aliafshar') # this is now authenticated

        :param username: The username to log in with.
        :param password: The password to log in with.
        """
        return self.db.login(username, password)

    def logout(self):
        """Log out of the FluidDB session
        """
        return self.db.logout()




