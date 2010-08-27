App.TagValuesGrid = Ext.extend(Ext.grid.EditorGridPanel, {
	border: false
	,closable: true
	,title: 'Tag values'
	,loadMask: true
	,oid: null
	,viewConfig: {emptyText: 'Nothing to display'}
	,sm: new Ext.grid.RowSelectionModel({singleSelect:true})
	,initComponent: function(){
		this.store = new Ext.data.JsonStore({
			url: App.Config.base_remote + 'tagvaluesfetch'
			,autoDestroy: true
			,root: 'tags'
			,fields: ['tag', 'value']
		});
		this.tbar = [
			{text: 'Reload', handler: this.onReload, scope: this}
			,{text: 'Load all tag values', handler: this.onLoadAllTags, scope: this}
			,{text: 'Add a tag', handler: this.onAddTag, scope: this}
		];
		this.action = new Ext.ux.grid.RowActions({
			header: 'Actions'
			,actions: [
				{iconCls: 'icon-refresh', tooltip: 'Load tag value'}
				,{iconCls: 'icon-delete', tooltip: 'Remove tag'}
			]
			,callbacks:{
				'icon-refresh': this.onRefresh.createDelegate(this)
				,'icon-delete': this.onDeleteTag.createDelegate(this)
			}
		});
		this.columns = [
			this.action
			,{id:'tag', header:'Tag', width: 230, dataIndex: 'tag', sortable: true}
			,{header: 'Value', width: 600, dataIndex: 'value', sortable: true, editor: {xtype: 'textfield'}}
		];
		this.plugins = [this.action];
		App.TagValuesGrid.superclass.initComponent.call(this);

	}
	,afterRender: function(){
		App.TagValuesGrid.superclass.afterRender.apply(this, arguments);

		if (this.oid) {
			this.store.load({params: {oid: this.oid}});
		}

		this.on('afteredit', this.onAfterEdit, this);
	}
	,onAfterEdit: function(e){
		var tag = e.record.data.tag;
		var value = e.value;

		Ext.Ajax.request({
			url: App.Config.base_remote + 'tagobject'
			,params: {oid: this.oid, tag: tag, value: value}
			,success: function(a){/*TODO:...*/}
		});
	}
	,onAddTag: function(){
		var tag = window.prompt('Please enter full tag path');
		var value = window.prompt('Value');
		Ext.Ajax.request({
			url: App.Config.base_remote + 'tagobject'
			,params: {oid: this.oid, tag: tag, value: value}
			,success: function(a){this.store.reload();}
			,scope: this
		});
	}
	,onLoadAllTags: function(a){
		this.store.each(this.setTag.createDelegate(this));
	}
	,onReload: function(){
		this.store.reload();
	}
	,onRefresh: function(g, r, action, row, col){
		this.setTag(r);
	}
	,onDeleteTag: function(g, r, action, row, col){
		r.set('value', '<em>removing tag...</em>');
		Ext.Ajax.request({
			url: App.Config.base_remote + 'deletetagvalue'
			,params: {oid: this.oid, tag: r.data.tag}
			,success: function(a){
				g.store.remove(r);
			}
		});
	}
	,setTag: function(r){
		r.set('value', '<em>loading...</em>');
		Ext.Ajax.request({
			url: App.Config.base_remote + 'gettagvalue'
			,params: {oid: this.oid, tag: r.data.tag}
			,success: function(a){
				r.set('value', a.responseText);
				r.commit();
			}
		});
	}
});

Ext.reg('app.tagvaluesgrid', App.TagValuesGrid);

