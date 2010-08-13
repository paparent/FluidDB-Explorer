# -*- coding: utf-8 -*-

"""
    fom.mapping
    ~~~~~~~~~~~

    Object orientated interface into FluidDB

    :copyright: 2010 Fom Authors.
    :license: MIT, see LICENSE for more information.
"""

import uuid

from fom.session import Fluid
from fom.errors import Fluid404Error


class SessionBound(object):
    """Something with a path that is bound to a database.

    .. attribute:: path

        The path of the item relative to the toplevel.

    .. attribute:: fluid

        The instance of fom.session.Fluid bound to this item.
    """

    def __init__(self, path, fluid=None):
        self.path = path
        if fluid is None:
            fluid = Fluid.bound
        self.fluid = fluid

class Policy(object):
    """
    Represents a policy specification for permissions on an action
    """
    def __init__(self, policy='open', exceptions=[]):
        self.policy = policy
        self.exceptions = exceptions

    def __repr__(self):
        return '<Policy: %s except for %s>' % (self.policy, self.exceptions)

    __str__ = __repr__

class Permissions(object):
    """
    A nicer view onto Namespace/Tag/TagValue permissions
    """
    def __init__(self, api):
        """ api references an appropriately created ItemPermissionsApi
        instance
        """
        self.api = api

    def __getitem__(self, key):
        """ return a policy for the referenced action (key) """
        val = self.api.get(key).value
        return Policy(policy=val['policy'], exceptions=val['exceptions'])

    def __setitem__(self, key, value):
        """
        set the policy (value) for the referenced action (key)
        """
        if isinstance(value, Policy):
            self.api.put(key, value.policy, value.exceptions)
        else:
            raise TypeError('Use an instance of Policy to set the policy')

class Namespace(SessionBound):
    """A FluidDB Namespace"""

    def __init__(self, path, fluid=None):
        super(Namespace, self).__init__(path, fluid)
        self.permissions = Permissions(self.fluid.permissions.namespaces[self.path])

    def create(self, description):
        """Create this namespace.

        >>> ns = Namespace(u'test/reviews')
        >>> ns.create(u'A place for all my reviews')
        <FluidResponse (201, 'application/json' ...>

        :param description: The description of the Namespace
        """
        parent, name = path_split(self.path)
        parent_api = self.fluid.namespaces[parent]
        return parent_api.post(name, description)

    def create_namespace(self, name, description):
        """Create a child namespace, and return it.

        >>> ns = Namespace(u'test')
        >>> reviews_ns = ns.create_namespace(
        ...     u'reviews', u'A place for all my reviews')


        :param name: The name of the Namespace to be created
        :param description: The description of the Namespace to be created
        """
        self.api.post(name, description)
        return Namespace(path_child(self.path, name))

    def create_tag(self, name, description, indexed):
        """Create a tag in this namespace.

        >>> ns = Namespace(u'test')
        >>> tag = ns.create_tag(u'review', u'A review I write', False)

        :param name: The name of the Tag to be created
        :param description: The description of the Tag to be created
        :param indexed: Whether the Tag will be indexed
        """
        self.fluid.tags[self.path].post(name, description, indexed)
        return Tag(path_child(self.path, name))

    def delete(self):
        """Delete this namespace

        >>> ns = Namespace(u'test/reviews')
        >>> ns.create(u'A place for my reviews')
        >>> ns.delete()
        """
        return self.api.delete()

    def tag(self, name):
        """Get a child Tag

        >>> ns = Namespace(u'fluiddb')
        >>> ns.tag(u'about')
        <fom.mapping.Tag object at 0x87c708c>

        :param name: The name of the child Tag to get.
        """
        return Tag(path_child(self.path, name))

    def namespace(self, name):
        """Get a child Namespace

        >>> ns = Namespace(u'fluiddb')
        >>> ns.namespace(u'default')
        <fom.mapping.Namespace object at 0x87c71ac>

        :param name: The name of the child Namespace to get.
        """
        return Namespace(path_child(self.path, name))

    @property
    def api(self):
        """The associated API instance for this Namespace

        It can be used to access lower-level information as required.
        Read-only.

        >>> ns = Namespace(u'fluiddb')
        >>> ns.api.get()
        <FluidResponse (200, 'application/json', ...>
        """
        return self.fluid.namespaces[self.path]

    def _get_description(self):
        """The description of this Namespace.

        Setting the value attempts to set the description in the FluidDB.

        >>> ns = Namespace(u'fluiddb')
        >>> ns.description
        u"FluidDB admin user's top-level namespace."
        """
        r = self.api.get(returnDescription=True)
        return r.value[u'description']

    def _set_description(self, description):
        """Set the description for this Namespace.
        """
        return self.api.put(description)

    description = property(_get_description, _set_description)

    @property
    def tag_names(self):
        """The names of the Tags in this Namespace.

        >>> ns = Namespace(u'fluiddb')
        >>> ns.tag_names
        [u'about']
        """
        r = self.api.get(returnTags=True)
        return r.value[u'tagNames']

    @property
    def tag_paths(self):
        """The full paths of the Tags in this Namespace

        >>> ns = Namespace(u'fluiddb')
        >>> ns.tag_paths
        [u'fluiddb/about']
        """
        return [
            path_child(self.path, child) for child in self.tag_names
        ]

    @property
    def tags(self):
        """The Tags in this Namespace

        >>> ns = Namespace(u'fluiddb')
        >>> ns.tags
        """
        return [
            Tag(path) for path in self.tag_paths
        ]

    @property
    def namespace_names(self):
        """The names of the child Namespaces in this Namespace

        >>> ns = Namespace(u'fluiddb')
        >>> ns.namespace_names
        [u'default', u'tags', u'tag-values', u'namespaces', u'users']
        """
        r = self.api.get(returnNamespaces=True)
        return r.value[u'namespaceNames']

    @property
    def namespace_paths(self):
        """The full paths of the child Namespaces in this Namespace

        >>> ns = Namespace(u'fluiddb')
        >>> ns.namespace_paths
        [u'fluiddb/default', u'fluiddb/tags', u'fluiddb/tag-values' ...]
        """
        return [
            path_child(self.path, child) for child in self.namespace_names
        ]

    @property
    def namespaces(self):
        """The child Namespaces in this Namespace

        >>> ns = Namespace(u'fluiddb')
        >>> ns.namespaces
        [<fom.mapping.Namespace object at 0x877ea4c>, ...]
        """
        return [
            Namespace(path) for path in self.namespace_paths
        ]

class Tag(SessionBound):
    """A FluidDB Tag"""

    def __init__(self, path, fluid=None):
        super(Tag, self).__init__(path, fluid)
        self.permissions = Permissions(self.fluid.permissions.tags[self.path])
        self.value_permissions = Permissions(self.fluid.permissions.tag_values[self.path])

    @property
    def api(self):
        """The associated API instance for this Tag

        It can be used to access lower-level information as required.
        Read-only.

        >>> tag = Tag(u'fluiddb/about')
        >>> tag.api.get()
        <FluidResponse (200, 'application/json', ...>
        """
        return self.fluid.tags[self.path]

    def _get_description(self):
        """The description of a tag.

        Setting the value attempts to set the description in the FluidDB.

        >>> tag = Tag(u'fluiddb/about')
        >>> tag.description
        u'A description of what an object is about.'
        """
        r = self.api.get(returnDescription=True)
        return r.value[u'description']

    def _set_description(self, description):
        """Set the description for a tag.
        """
        return self.api.put(description)

    description = property(_get_description, _set_description)

    def delete(self):
        """
        Delete this tag
        """
        self.api.delete()

class readonly_tag_value(object):
    """Descriptor to provide a tag value lookup on an object to simulate a
    simple attribute.
    """

    def __init__(self, tagpath):
        self.tagpath = tagpath

    def __get__(self, instance, owner):
        return instance.get(self.tagpath)[0]


class tag_value(readonly_tag_value):
    """Descriptor to provide a tag value lookup on an object to simulate a
    simple attribute. With write support.
    """

    def __init__(self, tagpath, defaultType=None):
        """
        defaultType argument sets the default mime-type to be used when
        PUTting the value
        """
        super(tag_value, self).__init__(tagpath)
        self.defaultType = defaultType

    def __set__(self, instance, value):
        return instance.set(self.tagpath, value, self.defaultType)



class Object(SessionBound):
    """An object
    """
    about = readonly_tag_value(u'fluiddb/about')

    def __init__(self, uid=None, about=None, fluid=None):
        self.uid = uid
        self.fluid = fluid or Fluid.bound
        if about is not None:
            self.create(about)

    def create(self, about=None):
        """Create a new object.
        """
        r = self.fluid.objects.post(about)
        self.uid = r.value[u'id']

    def get(self, tag):
        """Get the value of a tag.
        """
        tagpath = tag
        r = self.api[tagpath].get()
        return r.value, r.content_type

    def set(self, tagpath, value, valueType=None):
        """Set the value of a tag.
        """
        self.api[tagpath].put(value, valueType)

    def delete(self, tagpath):
        self.api[tagpath].delete()

    @property
    def api(self):
        """The api ObjectApi for this instance.
        """
        return self.fluid.objects[self.uid]

    def has(self, tag):
        """Check if an object has a tag.
        """
        tagpath = tag
        try:
            self.api[tagpath].head()
        except Fluid404Error:
            return False
        else:
            return True

    @property
    def tag_paths(self):
        r = self.api.get()
        return r.value[u'tagPaths']

    @property
    def tags(self):
        return [Tag(path) for path in self.tag_paths]

    @classmethod
    def filter(cls, query, result_type=None):
        """
        Returns a collection of objects that match the supplied query written
        in the query language described here:

        http://doc.fluidinfo.com/fluidDB/queries.html

        If result_type is passed the results will be instantiated as a list of
        result_type otherwise they'll be instantiations of cls.
        """
        objects = Fluid.bound.objects.get(query)
        class_type = result_type and result_type or cls
        return [class_type(uid) for uid in objects.value['ids']]

    def __repr__(self):
        return '<%s %s>' % (self.__class__.__name__, self.about)

class tag_relation(tag_value):
    """Descriptor to provide a relation lookup.

    An id is actually stored in the database.
    """

    def __init__(self, tag, object_type=Object):
        tag_value.__init__(self, tag)
        self.object_type = object_type

    def __get__(self, instance, owner):
        uid = tag_value.__get__(self, instance, owner)
        return self.object_type(uid)

    def __set__(self, instance, value):
        return tag_value.__set__(self, instance, value.uid)


class CollectionManager(object):

    def __init__(self, instance, base_tagpath, object_type=Object):
        self.instance = instance
        self.base_tagpath = base_tagpath
        self.object_type = object_type
        self.target_tagpath = self._get_tagpath()

    def add(self, other):
        other.set(self.target_tagpath, self.instance.uid)

    def remove(self, other):
        other.delete(self.target_tagpath)

    def __iter__(self):
        for item_id in self._fetch():
            yield self.object_type(uid=item_id)

    def __contains__(self, other):
        for item in self._fetch():
            if other.uid == item:
                return True
        return False

    def _get_query(self):
        return 'has %s' % self.target_tagpath

    def _get_tagpath(self):
        try:
            return self.instance.get(self.base_tagpath)[0]
        except Fluid404Error:
            # manager is not yet created
            return self._create_manager()

    def _create_manager(self):
        uid = self._generate_uid()
        tag_path = '/'.join([self.base_tagpath, uid])
        self.instance.set(self.base_tagpath, tag_path)
        Namespace(self.base_tagpath).create_tag(uid, u'Manager tag', True)
        return tag_path

    def _generate_uid(self):
        url = '%s/%s' % (self.instance.fluid.db._get_url(self.instance.api.url),
                         self.base_tagpath)
        uid = unicode(uuid.uuid5(uuid.NAMESPACE_URL, str(url))).replace('-', '')
        return uid

    def _fetch(self):
        resp = self.instance.fluid.objects.get(self._get_query())
        for obj in resp.value[u'ids']:
            yield obj

class tag_manager(tag_value):

    def __init__(self, tagpath, map_type=Object, manager_type=CollectionManager):
        tag_value.__init__(self, tagpath)
        self.map_type = map_type
        self.manager_type = manager_type

    def __get__(self, instance, owner):
        if instance.uid is None:
            raise ValueError(u'This object has not been created.')
        return self.manager_type(instance, self.tagpath, self.map_type)



def path_child(path, child):
    """Get the named child for a path.
    """
    if path == '':
        return child
    else:
        return '/'.join((path, child))


def path_split(path):
    """Split a path into parent, self
    """
    return path.rsplit('/', 1)
