"""
Fom - Fluid Object Mapper
=========================

Fom is a library for accessing FluidDB (http://fluidinfo.com). The name Fluid
Object Mapper is meant to reflect the similarity between this and ORM
software.

It is presented as a two-level API:

1. Low-level API that is a faithful representation of the the REST API.
2. An object orientated layer built on the REST API.

This is designed to please everyone depending on how \"pure\" to the actual
FluidDB API the user wants to be. There is also seamless integration between
the two layers so that they are easy to switch between.

:copyright: 2009-2010 Fom Authors.
:license: MIT, see LICENSE for more information.

"""

from session import Fluid
from fom.mapping import Object, Namespace, Tag, tag_value

__all__ = ['Fluid']
