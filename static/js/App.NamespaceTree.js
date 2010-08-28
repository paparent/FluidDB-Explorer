App.NamespacesTree = Ext.extend(Ext.tree.TreePanel, {
	autoScroll: true
	,id: 'namespacestree'
	,animate: false
	,border: false
	,title: 'Namespaces'
	,root: {nodeType: 'async', text: App.Config.rootlabel, id: App.Config.rootid, draggable: false}
	,contextMenu: new Ext.menu.Menu({
		items: [
			{id: 'ns-create-namespace', text: 'Create new namespace'}
			,{id: 'ns-delete-namespace', text: 'Delete namespace'}
			,'-'
			,{id: 'ns-create-tag', text: 'Create new tag'}
			,{id: 'ns-delete-tag', text: 'Delete tag'}
			,'-'
			,{id: 'ns-permission', text: 'Permissions'}

		]
		,listeners: {
			itemclick: function(i){
				var node = i.parentMenu.contextNode;
				var loader = node.getOwnerTree().getLoader();
				var path = node.id;
				switch (i.id) {
				case 'ns-create-namespace':
					var namespace = window.prompt('Namespace name');
					var desc = window.prompt('Description');
					Ext.Ajax.request({
						url: App.Config.base_remote + 'createnamespace'
						,params: {path: path, namespace: namespace, description: desc}
						,success: function(){loader.load(node,function(){node.expand();});}
					});
					break;
				case 'ns-delete-namespace':
					parentNode = node.parentNode;
					Ext.Ajax.request({
						url: App.Config.base_remote + 'deletenamespace'
						,params: {namespace: path}
						,success: function(){loader.load(parentNode,function(){parentNode.expand();});}
					});
					break;
				case 'ns-create-tag':
					var tag = window.prompt('Tag name');
					var desc = window.prompt('Description');
					Ext.Ajax.request({
						url: App.config.base_remote + 'createtag'
						,params: {path: path, tag: tag, description: desc}
						,success: function(){loader.load(node,function(){node.expand();});}
					});
					break;
				case 'ns-delete-tag':
					parentNode = node.parentNode;
					Ext.Ajax.request({
						url: App.Config.base_remote + 'deletetag'
						,params: {tag: path}
						,success: function(){loader.load(parentNode,function(){parentNode.expand();});}
					});
					break;
				case 'ns-permission':
					node.getOwnerTree().fireEvent('permission', path, node.leaf?'tag':'ns');
					break;
				}
			}
		}
	})
	,initComponent: function(){
		this.addEvents('tagclick');
		this.loader = new Ext.tree.TreeLoader({
			url: App.Config.base_remote + 'namespacesfetch'
		});

		this.tbar = [
			new Ext.form.TriggerField({
				width: 200
				,triggerClass: 'x-form-clear-trigger'
				,hideTrigger: true
				,emptyText:'Filter'
				,enableKeyEvents: true
				,onTriggerClick: function() {
					this.el.dom.value = '';
					this.trigger.hide();
					this.ownerCt.ownerCt.filter.clear();
				}
				,listeners: {
					render: function(f) {
						this.filter = new Ext.tree.TreeFilter(this, {
							clearBlank: true
							,autoClear: true
						});
					}
					,keydown: {
						fn: this.filterTree
						,buffer: 350
						,scope: this
					}
					,scope: this
				}
			})
		];

		App.NamespacesTree.superclass.initComponent.call(this);
		this.on('click', this.nodeClick, this);
		this.on('contextmenu', this.onCtxMenu, this);
	}
	,filterTree: function(t, e) {
		var text = t.getValue();
		if (!text) {
			this.filter.clear();
			return;
		}

		t.trigger.show();

		var re = new RegExp('^' + Ext.escapeRe(text), 'i');
		this.filter.filterBy(function(n) {
			return re.test(n.text);
		});
	}
	,nodeClick: function(a, b){
		if (a.id == 'root' || !a.attributes.leaf) {
			return;
		}
		this.fireEvent('tagclick', a.id);
	}
	,onCtxMenu: function(n, e){
		n.select();
		var c = n.getOwnerTree().contextMenu;
		c.contextNode = n;

		if (n.leaf) {
			// Tag
			c.findById('ns-create-tag').disable();
			c.findById('ns-create-namespace').disable();
			c.findById('ns-delete-tag').enable();
			c.findById('ns-delete-namespace').disable();
		}
		else {
			// Namespace
			c.findById('ns-create-tag').enable();
			c.findById('ns-create-namespace').enable();
			c.findById('ns-delete-tag').disable();
			c.findById('ns-delete-namespace').enable();
		}

		c.showAt(e.getXY());
	}
});

Ext.reg('app.namespacestree', App.NamespacesTree);

