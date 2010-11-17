# -*- coding: utf-8 -*-

"""
    fom.mapping
    ~~~~~~~~~~~

    Object orientated interface into FluidDB

    :copyright: 2010 Fom Authors.
    :license: MIT, see LICENSE for more information.
"""

import uuid

from fom.db import ITERABLE_TYPES, SERIALIZABLE_TYPES
from fom.session import Fluid
from fom.errors import Fluid404Error


def _get_tag_values(cls):
    """Given a class will return a list containing the name and instance of
    all the attributes that are of type readonly_tag_value
    """
    # Step 1. Create the list of matching fields associated with this klass
    tags = [(name, instance)
        for (name, instance) in cls.__dict__.items()
        if isinstance(instance, readonly_tag_value)]
    # Step 2. recursively loop over the parent classes of klass so we don't
    # miss any fields *they* might have defined (like "about" in the Object
    # class)
    for b in cls.__bases__:
        if issubclass(b, Object):
            tags.extend(_get_tag_values(b))
    return tags


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

    def __repr__(self):
        return '<%s path=%r>' % (self.__class__.__name__, self.path)


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
    """A FluidDB Namespace
    """

    def __init__(self, path, fluid=None):
        super(Namespace, self).__init__(path, fluid)
        self.permissions = Permissions(
            self.fluid.permissions.namespaces[self.path])

    def create(self, description):
        """Create this namespace.

        :param description: The description of the Namespace
        """
        parent, name = path_split(self.path)
        parent_api = self.fluid.namespaces[parent]
        return parent_api.post(name, description)

    def create_namespace(self, name, description):
        """Create a child namespace, and return it.

        :param name: The name of the Namespace to be created
        :param description: The description of the Namespace to be created
        """
        self.api.post(name, description)
        return Namespace(path_child(self.path, name))

    def create_tag(self, name, description, indexed):
        """Create a tag in this namespace, and return it.

        :param name: The name of the Tag to be created
        :param description: The description of the Tag to be created
        :param indexed: Whether the Tag will be indexed
        """
        self.fluid.tags[self.path].post(name, description, indexed)
        return Tag(path_child(self.path, name))

    def delete(self):
        """Delete this namespace.
        """
        return self.api.delete()

    def tag(self, name):
        """Get a child tag of this namespace.

        :param name: The name of the child Tag to get.
        """
        return Tag(path_child(self.path, name))

    def namespace(self, name):
        """Get a child namespace of this namespace

        :param name: The name of the child namespace to get.
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

        Setting and getting the value attempts to set/get the description in
        FluidDB.
        """
        r = self.api.get(returnDescription=True)
        return r.value[u'description']

    def _set_description(self, description):
        """Set the description for this Namespace.
        """
        return self.api.put(description)

    # python2.5
    description = property(_get_description, _set_description,
                           doc=_get_description.__doc__)

    @property
    def tag_names(self):
        """The names of the Tags in this Namespace.
        """
        r = self.api.get(returnTags=True)
        return r.value[u'tagNames']

    @property
    def tag_paths(self):
        """The full paths of the Tags in this Namespace
        """
        return [path_child(self.path, child) for child in self.tag_names]

    @property
    def tags(self):
        """The Tags in this Namespace
        """
        return [Tag(path) for path in self.tag_paths]

    @property
    def namespace_names(self):
        """The names of the child Namespaces in this Namespace
        """
        r = self.api.get(returnNamespaces=True)
        return r.value[u'namespaceNames']

    @property
    def namespace_paths(self):
        """The full paths of the child Namespaces in this Namespace
        """
        return [path_child(self.path, child) for child in self.namespace_names]

    @property
    def namespaces(self):
        """The child Namespaces in this Namespace
        """
        return [Namespace(path) for path in self.namespace_paths]


class Tag(SessionBound):
    """A FluidDB Tag"""

    def __init__(self, path, fluid=None):
        super(Tag, self).__init__(path, fluid)
        self.permissions = Permissions(self.fluid.permissions.tags[self.path])
        self.value_permissions = Permissions(
            self.fluid.permissions.tag_values[self.path])

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

    :param tagpath: The path of the tag to store this value in and read it
                    from
    """

    def __init__(self, tagpath, cached=True):
        self.tagpath = tagpath
        self.cached = cached

    def __get__(self, instance, owner):
        if self.cached:
            value = instance.get_cached(self.tagpath)
        else:
            value = None
        if value is None:
            value = instance.get(self.tagpath)[0]
        return value


class tag_value(readonly_tag_value):
    """Descriptor to provide a tag value lookup on an object to simulate a
    simple attribute. With write support.

    :param tagpath: The path of the tag to store this value in and read it
                    from

    :param content_type: The default MIME-type to be used when PUTting the
                         value

    :param cached: Flag to indicate if the value should be cached locally

    :param lazy_save: Flag to indicate if the field's value should be updated
                      when the instance.save() method is called
    """

    def __init__(self, tagpath, content_type=None, cached=True,
        lazy_save=True):
        """
        content_type argument sets the default mime-type to be used when
        PUTting the value
        """
        super(tag_value, self).__init__(tagpath, cached)
        self.content_type = content_type
        self.lazy_save = lazy_save

    def __set__(self, instance, value):
        if self.lazy_save:
            instance.set_lazy_tag_value(self, value)
        else:
            return instance.set(self.tagpath, value, self.content_type)


class Object(SessionBound):
    """An object
    """

    about = readonly_tag_value(u'fluiddb/about')

    def __init__(self, uid=None, about=None, fluid=None, initial={}):
        # the object's UUID
        self.uid = uid
        self.fluid = fluid or Fluid.bound
        # Create the _path_map dict for the instantiated class
        self._path_map = {}
        for attribute, tag in _get_tag_values(self.__class__):
            self._path_map[tag.tagpath] = attribute
        # check about isn't in the initial values
        if 'fluiddb/about' in initial:
            if about is None:
                about = initial['fluiddb/about']['value']
                del initial['fluiddb/about']
        # react appropriately to an about value
        if about is not None:
            self.create(about)
        # cache for tag values
        self._cache = {}
        # a list of fields whose value has been updated but not saved
        self._dirty_fields = set()
        # if there are some initial values then set them for the appropriate
        # fields in this object (using the _path_map created above)
        # keys = tag paths, e.g. "fluiddb/about"
        # values = initial values, e.g. any FluidDB primitive type value
        # see: http://api.fluidinfo.com/html/api.html#values_GET
        for tag_path, value in initial.iteritems():
            if 'value' in value:
                setattr(self, self._path_map[tag_path], value['value'])

    def create(self, about=None):
        """Create a new object.
        """
        r = self.fluid.objects.post(about)
        self.uid = r.value[u'id']
        self.about = about

    def get(self, tagpath):
        """Get the value of a tag.
        """
        r = self.api[tagpath].get()
        self._cache[tagpath] = r.value
        return r.value, r.content_type

    def get_cached(self, tagpath):
        """Get the cached value of a tag.
        """
        return self._cache.get(tagpath)

    def refresh(self, *tagpaths):
        """
        Clears the local cache
        """
        if tagpaths:
            for tagpath in tagpaths:
                del self._cache[tagpath]
        else:
            self._cache.clear()

    def set(self, tagpath, value, valueType=None):
        """Set the value of a tag.
        """
        self._cache[tagpath] = value
        # check if updating a tag handled by one of the tag_value attributes
        if tagpath in self._path_map:
            # get the tag_value instance
            tv = self.__class__.__dict__[self._path_map[tagpath]]
            if tv.lazy_save:
                # update on save()
                self.set_lazy_tag_value(tv, value)
            else:
                # update right now
                self.api[tagpath].put(value, valueType)
        else:
            # the tag isn't associated with a tag_value on this object
            self.api[tagpath].put(value, valueType)

    def set_lazy_tag_value(self, tag_value, value):
        """Sets the value of the given tag_value instance to be pushed to
        FluidDB only when save() is called
        """
        # validate that the value is a primitive type (the only sort allowed
        # by the /values api)
        pt = type(value)
        if pt in SERIALIZABLE_TYPES:
            if pt in ITERABLE_TYPES:
                if not all(isinstance(x, basestring) for x in value):
                    # it was a list like structure that contained more than
                    # just strings
                    raise ValueError('Cannot lazy-save a non-primitive value.')
        else:
            raise ValueError('Cannot lazy-save a non-primitive value.')
        # store away for when the save() method is called
        self._dirty_fields.add(tag_value)
        self._cache[tag_value.tagpath] = value

    def delete(self, tagpath):
        """Removes a tag from the object
        """
        self.api[tagpath].delete()

    def save(self):
        """Saves those fields that have been updated
        """
        if not self.about:
            raise ValueError(
                "Cannot save for an object without an about value")
        if self._dirty_fields:
            # values is the dict that will become the PUT payload to /values
            values = {}
            for item in self._dirty_fields:
                tagpath = item.tagpath
                # This check is done so the tag_relational capabilities work
                # properly (i.e. the __get__ will return an instance of an
                # object whose UUID should be referenced)
                val = item.__get__(self, self.__class__)
                if isinstance(item, tag_relation):
                    val = val.uid
                values[tagpath] = {'value': val}
            # use the unique about value to identify this object in FluidDB
            query = 'fluiddb/about = "%s"' % self.about
            # update the values using the /values api
            self.fluid.values.put(query, values)
            # none of the fields are now dirty
            self._dirty_fields.clear()

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
        return '<%s %s>' % (self.__class__.__name__, self.uid)

    def __eq__(self, other):
        return self.uid and (other.uid == self.uid)


class tag_relation(tag_value):
    """Descriptor to provide a relation lookup.

    An id is actually stored in the database.
    """

    def __init__(self, tag, object_type=Object, cached=True, lazy_save=True):
        tag_value.__init__(self, tag, cached=cached, lazy_save=lazy_save)
        self.object_type = object_type

    def __get__(self, instance, owner):
        uid = tag_value.__get__(self, instance, owner)
        return self.object_type(uid)

    def __set__(self, instance, value):
        return tag_value.__set__(self, instance, value.uid)


class tag_relations(tag_value):
    """Descriptor to provide a list of relations.

    A list of ids are stored in the database
    """

    def __init__(self, tagpath, object_type=Object, cached=True,
            lazy_save=True):
        tag_value.__init__(self, tagpath, cached=cached, lazy_save=lazy_save)
        self.object_type = object_type

    def __get__(self, instance, owner):
        uids = tag_value.__get__(self, instance, owner)
        return [self.object_type(uid) for uid in uids]

    def __set__(self, instance, value):
        uids = [obj.uid for obj in value]
        return tag_value.__set__(self, instance, uids)


class CollectionManager(object):

    base_nspath = 'test/fom/Collections'

    def __init__(self, instance, tagpath, object_type, foreign_tagpath):
        self.instance = instance
        self.tagpath = tagpath
        self.object_type = object_type
        self.foreign_tagpath = foreign_tagpath
        self.target_tagpath = self._get_tagpath()

    def add(self, other):
        other.set(self.target_tagpath, self.instance.uid)
        if self.foreign_tagpath is not None:
            # don't set foreign on the reverse side
            manager = CollectionManager(other, self.foreign_tagpath,
                                        self.object_type, None)
            manager.add(self.instance)

    def remove(self, other):
        other.delete(self.target_tagpath)
        if self.foreign_tagpath is not None:
            # don't set foreign on the reverse side
            manager = CollectionManager(other, self.foreign_tagpath,
                                        self.object_type, None)
            manager.remove(self.instance)

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
            return self.instance.get(self.tagpath)[0]
        except Fluid404Error:
            # manager is not yet created
            return self._create_manager()

    def _create_manager(self):
        uid = self._generate_uid()
        tagpath = '/'.join([self.base_nspath, uid])
        self.instance.set(self.tagpath, tagpath)
        Namespace(self.base_nspath).create_tag(uid, u'Manager tag', True)
        return tagpath

    def _generate_uid(self):
        url = '%s/%s' % (self.instance.fluid.db._get_url(
                            self.instance.api.url), self.tagpath)
        uid = unicode(
            uuid.uuid5(uuid.NAMESPACE_URL, str(url))).replace('-', '')
        return uid

    def _fetch(self):
        resp = self.instance.fluid.objects.get(self._get_query())
        for obj in resp.value[u'ids']:
            yield obj

    def __str__(self):
        return str(list(self))


class tag_collection(tag_value):

    def __init__(self, tagpath, map_type=Object,
                 manager_type=CollectionManager, foreign_tagpath=None,
                 lazy_save=True):
        tag_value.__init__(self, tagpath, lazy_save=True)
        self.map_type = map_type
        self.manager_type = manager_type
        self.foreign_tagpath = foreign_tagpath

    def __get__(self, instance, owner):
        if instance.uid is None:
            raise ValueError(u'This object has not been created.')
        return self.manager_type(instance, self.tagpath, self.map_type,
                                 self.foreign_tagpath)


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
