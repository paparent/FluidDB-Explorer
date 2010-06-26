App.Login = Ext.extend(Ext.Button, {
	text: 'Logged as: ' + App.Config.username
	,initComponent: function(){
		this.handler = this.onClick;
		App.Login.superclass.initComponent.call(this);
	}
	,onClick: function(a){
		var username = window.prompt("Username");
		var password = window.prompt("Password");
		Ext.Ajax.request({
			url: '/remote/login'
			,params: {username: username, password: password}
			,success: function(r, o){Ext.Msg.alert('Login', 'You are now logged');}
			,failure: function(r, o){Ext.Msg.alert('Failed', 'Something wrong happend');}
		});
	}
});

Ext.reg('app.login', App.Login);

App.MainPanel = Ext.extend(Ext.TabPanel, {
	border: false
	,enableTabScroll: true
	,activeTab: 0
	,initComponent: function(){
		this.items = [{bodyStyle: 'padding:10px', contentEl: 'welcome', title: 'Welcome'}];
		App.MainPanel.superclass.initComponent.call(this);
	}
	,addTab: function(a){
		var b = this.add(a);
		this.setActiveTab(b);
	}
	,openObject: function(oid){
		this.addTab(new App.ObjectPanel({oid:oid}));
	}
});

Ext.reg('app.mainpanel', App.MainPanel);

App.NamespacesTree = Ext.extend(Ext.tree.TreePanel, {
	autoScroll: true
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
						url: '/remote/createnamespace'
						,params: {path: path, namespace: namespace, description: desc}
						,success: function(){loader.load(node,function(){node.expand();});}
					});
					break;
				case 'ns-delete-namespace':
					parentNode = node.parentNode;
					Ext.Ajax.request({
						url: '/remote/deletenamespace'
						,params: {namespace: path}
						,success: function(){loader.load(parentNode,function(){parentNode.expand();});}
					});
					break;
				case 'ns-create-tag':
					var tag = window.prompt('Tag name');
					var desc = window.prompt('Description');
					Ext.Ajax.request({
						url: '/remote/createtag'
						,params: {path: path, tag: tag, description: desc}
						,success: function(){loader.load(node,function(){node.expand();});}
					});
					break;
				case 'ns-delete-tag':
					parentNode = node.parentNode;
					Ext.Ajax.request({
						url: '/remote/deletetag'
						,params: {tag: path}
						,success: function(){loader.load(parentNode,function(){parentNode.expand();});}
					});
					break;
				}
			}
		}
	})
	,initComponent: function(){
		this.addEvents('tagclick');
		this.loader = new Ext.tree.TreeLoader({
			url: '/remote/namespacesfetch'
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

App.ObjectPanel = Ext.extend(Ext.Panel, {
	border: false
	,closable: true
	,layout: 'fit'
	,initComponent: function(){
		App.ObjectPanel.superclass.initComponent.call(this);
		this.setTitle('Object ' + this.oid);
		this.add(new App.TagValuesGrid({oid: this.oid}));
	}
});

Ext.reg('app.objectpanel', App.ObjectPanel);

App.QueryField = Ext.extend(Ext.form.TwinTriggerField, {
	emptyText: 'Query'
	,trigger1Class: 'x-form-clear-trigger'
	,trigger2Class: 'x-form-search-trigger'
	,validationEvent: false
	,validateOnBlur: false
	,hideTrigger1: true
	,width:300
	,initComponent: function(){
		this.addEvents('query');
		App.QueryField.superclass.initComponent.call(this);
		this.on('specialkey', function(f, e){
			if (e.getKey() == e.ENTER) {
				this.onTrigger2Click();
			}
		}, this);
	}
	,onTrigger1Click: function(){
		this.el.dom.value = '';
		this.triggers[0].hide();
		this.focus();
	}
	,onTrigger2Click: function(){
		var v = this.getRawValue();
		var l = v.length;
		if (l < 1) {
			this.onTrigger1Click();
			return;
		}
		this.fireEvent('query', v);
		this.triggers[0].show();
	}
});

Ext.reg('app.queryfield', App.QueryField);

App.ResultsGrid = Ext.extend(Ext.grid.GridPanel, {
	border: false
	,closable: true
	,title: 'Query results'
	,loadMask: true
	,query: null
	,sm: new Ext.grid.RowSelectionModel({singleSelect:true})
	,columns: [
		{id:'oid', header:'Object ID', width: 230, dataIndex: 'oid'}
		,{header: 'About', width: 600, dataIndex: 'about'}
	]
	,initComponent: function(){
		this.store = new Ext.data.JsonStore({
			url: '/remote/query'
			,root: 'ids'
			,fields: ['oid', 'about']
		});
		this.tbar = [
			{text:'Load all about tags',scope:this,handler:this.onLoadAll}
		];
		App.ResultsGrid.superclass.initComponent.call(this);

		if (this.query) {
			this.setTitle('Query results: "' + this.query + '"');
			this.execQuery(this.query);
		}
		this.on('rowdblclick', this.onRowDblClick, this);
	}
	,execQuery: function(a){
		this.store.load({params: {query:a}});
	}
	,onRowDblClick: function(a, b, c){
		var row = a.getSelectionModel().getSelected();
		var oid = row.data.oid;
		Ext.getCmp('mainpanel').openObject(oid);
	}
	,onLoadAll: function(a){
		function abc(r) {
			r.set('about', '<em>loading...</em>');
			Ext.Ajax.request({
				url: '/remote/gettagvalue'
				,params: {oid: r.data.oid, tag: "fluiddb/about"}
				,success: function(a){
					r.set('about', a.responseText);
					r.commit();
				}
			});
		}
		this.store.each(abc);
	}
});

Ext.reg('app.resultsgrid', App.ResultsGrid);

App.TagValuesGrid = Ext.extend(Ext.grid.EditorGridPanel, {
	border: false
	,closable: true
	,title: 'Tag values'
	,loadMask: true
	,oid: null
	,sm: new Ext.grid.RowSelectionModel({singleSelect:true})
	,columns: [
		{id:'tag', header:'Tag', width: 230, dataIndex: 'tag'}
		,{header: 'Value', width: 600, dataIndex: 'value', editor: {xtype: 'textfield'}}
	]
	,initComponent: function(){
		this.store = new Ext.data.JsonStore({
			url: '/remote/tagvaluesfetch'
			,root: 'tags'
			,fields: ['tag', 'value']
		});
		this.tbar = [
			{text: 'Load all tag values', handler: this.onLoadAllTags, scope: this}
			,{text: 'Add a tag', handler: this.onAddTag, scope: this}
		];
		App.TagValuesGrid.superclass.initComponent.call(this);

	}
	,afterRender: function(){
		App.TagValuesGrid.superclass.afterRender.apply(this, arguments);

		if (this.oid) {
			this.store.load({params: {oid: this.oid}});
		}

		this.on('afteredit', this.onAfterEdit, this);
		this.on('rowdblclick', this.onRowDblClick, this);

	}
	,onAfterEdit: function(e){
		var tag = e.record.data.tag;
		var value = e.value;

		Ext.Ajax.request({
			url: '/remote/tagobject'
			,params: {oid: this.oid, tag: tag, value: value}
			,success: function(a){/*TODO:...*/}
		});
	}
	,onRowDblClick: function(a, b, c){
		var row = a.getSelectionModel().getSelected();

		Ext.Ajax.request({
			url: '/remote/gettagvalue'
			,params: {oid: this.oid, tag: row.data.tag}
			,success: function(a){
				Ext.Msg.alert('Value', a.responseText);
			}
		});
	}
	,onAddTag: function(){
		var tag = window.prompt('Please enter full tag path');
		var value = window.prompt('Value');
		Ext.Ajax.request({
			url: '/remote/tagobject'
			,params: {oid: this.oid, tag: tag, value: value}
			,success: function(a){this.store.reload();}
			,scope: this
		});
	}
	,onLoadAllTags: function(a){
		oid = this.oid;
		function abc(r) {
			r.set('value', '<em>loading...</em>');
			Ext.Ajax.request({
				url: '/remote/gettagvalue'
				,params: {oid: oid, tag: r.data.tag}
				,success: function(a){
					r.set('value', a.responseText);
					r.commit();
				}
			});
		}
		this.store.each(abc);
	}
});

Ext.reg('app.tagvaluesgrid', App.TagValuesGrid);

if (typeof console == "undefined") var console = { log: function() {} };
Ext.BLANK_IMAGE_URL = '/static/extjs/resources/images/default/s.gif';

Ext.onReady(function() {
	Ext.QuickTips.init();

	sidePanel = new App.NamespacesTree();

	var queryId = Ext.id();
	var loginId = Ext.id();
	mainPanel = new App.MainPanel({id: 'mainpanel'});

	var viewport = new Ext.Viewport({
		layout: 'border'
		,items: [{
			border: false
			,cls: 'header'
			,layout: 'hbox'
			,layoutConfig: {align: 'stretch'}
			,defaults: {margins: '5 5 5 0'}
			,region: 'north'
			,height: 30
			,items: [
				{xtype: 'box', el: 'logo', border: false}
				,{border: false, flex: 1}
				,{xtype: 'app.queryfield', id: queryId}
				,{xtype: 'app.login', id: loginId}
			]
			}
			,{region: 'west', border: true, margins: '5 0 5 5', collapsible: true, collapseMode: 'mini', hideCollapseTool:true, split: true, minSize: 100, maxSize: 400, width: 240, layout: 'fit', items: sidePanel}
			,{region: 'center', border: true, margins: '5 5 5 0', layout: 'fit', items: mainPanel}
		]
	});

	var query = Ext.getCmp(queryId);
	var login = Ext.getCmp(loginId);

	var lastTag = '';
	sidePanel.on('tagclick', function(t){
		var grid = new App.ResultsGrid({query: 'has ' + t});
		mainPanel.addTab(grid);
	});

	query.on('query', function(q){
		var grid = new App.ResultsGrid({query: q});
		mainPanel.addTab(grid);
	});

});

