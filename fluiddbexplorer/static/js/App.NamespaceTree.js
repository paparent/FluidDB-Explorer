App.NamespacesTree = Ext.extend(Ext.tree.TreePanel, {
	autoScroll: true
	,id: 'namespacestree'
	,animate: false
	,border: false
	,title: 'Namespaces'
	,root: {nodeType: 'async', text: App.Config.rootlabel, id: App.Config.rootid, draggable: false}
	,initComponent: function(){
		this.addEvents({
			'tagclick': true
			,'permission': true
			,'openobject': true
		});

		this.loader = new Ext.tree.TreeLoader({
			directFn: direct.NamespacesFetch
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

		this.tools = [
			{id: 'gear', qtip: 'Change top-level namespace',  handler: this.changeTopLevelNS}
		];

		App.NamespacesTree.superclass.initComponent.call(this);
		this.on('click', this.nodeClick, this);
		this.on('contextmenu', this.onCtxMenu, this);
	}
	,changeTopLevelNS: function(e, toolEl, panel, tc) {
		Ext.Msg.prompt('Top level Namespace', 'Please enter the path of the new namespace', function(btn, text){
			if (btn == 'ok') {
				App.Config.rootid = text;
				rootnode = panel.getRootNode();
				rootnode.setId(text);
				rootnode.setText(text);
				panel.getLoader().load(rootnode);
				rootnode.expand();
			}
		});
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
		this.fireEvent('tagclick', a.id.replace(/^tag-/, ''));
	}
	,onCtxMenu: function(node, e){
		node.select();

		if (node.leaf) {
			// Tag
			if (!this.ctxMenuTag) {
				this.ctxMenuTag = new Ext.menu.Menu({
					items: [
						{id: 'ns-openobject', text: 'Open object'}
						,'-'
						,{id: 'ns-delete-tag', text: 'Delete tag'}
						,'-'
						,{id: 'ns-permission', text: 'Permissions'}
					]
					,listeners: {itemclick: this.ctxMenuHandler}
				});
			}

			this.ctxMenuTag.contextNode = node;
			ctxMenu = this.ctxMenuTag;
		}
		else {
			// Namespace
			if (!this.ctxMenuNS) {
				this.ctxMenuNS = new Ext.menu.Menu({
					items: [
						{id: 'ns-openobject', text: 'Open object'}
						,'-'
						,{id: 'ns-create-namespace', text: 'Create new namespace'}
						,{id: 'ns-delete-namespace', text: 'Delete namespace'}
						,'-'
						,{id: 'ns-create-tag', text: 'Create new tag'}
						,'-'
						,{id: 'ns-permission', text: 'Permissions'}

					]
					,listeners: {itemclick: this.ctxMenuHandler}
				});
			}

			this.ctxMenuNS.contextNode = node;
			ctxMenu = this.ctxMenuNS;
		}

		ctxMenu.showAt(e.getXY());
	}
	,ctxMenuHandler: function(i){
		var node = i.parentMenu.contextNode;
		var loader = node.getOwnerTree().getLoader();
		var path = node.id.replace(/^(ns-|tag-)/, '');
		switch (i.id) {
		case 'ns-create-namespace':
			var namespace = window.prompt('Namespace name');
			var desc = window.prompt('Description');
			direct.CreateNamespace(path, namespace, desc, function(){loader.load(node,function(){node.expand();});});
			break;
		case 'ns-delete-namespace':
			parentNode = node.parentNode;
			direct.DeleteNamespace(path, function(){loader.load(parentNode,function(){parentNode.expand();});});
			break;
		case 'ns-create-tag':
			var tag = window.prompt('Tag name');
			var desc = window.prompt('Description');
			direct.CreateTag(path, tag, desc, function(){loader.load(node,function(){node.expand();});});
			break;
		case 'ns-delete-tag':
			parentNode = node.parentNode;
			direct.DeleteTag(path, function(){loader.load(parentNode,function(){parentNode.expand();});});
			break;
		case 'ns-permission':
			node.getOwnerTree().fireEvent('permission', path, node.leaf?'tag':'ns');
			break;
		case 'ns-openobject':
			node.getOwnerTree().fireEvent('openobject', path, node.leaf?'tag':'ns');
			break;
		}
	}
});

Ext.reg('app.namespacestree', App.NamespacesTree);

