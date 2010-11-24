App.TagValuesGrid = Ext.extend(Ext.grid.EditorGridPanel, {
	border: false
	,closable: true
	,title: 'Tag values'
	,loadMask: true
	,oid: null
	,viewConfig: {emptyText: 'Nothing to display'}
	,sm: new Ext.grid.RowSelectionModel({singleSelect:true})
	,initComponent: function(){
		this.store = gridstore = new Ext.data.JsonStore({
			url: App.Config.base_remote + 'tagvaluesfetch'
			,autoDestroy: true
			,root: 'tags'
			,fields: ['tag', 'value', 'readonly']
		});
		this.tbar = [
			{text: 'Refresh', iconCls: 'icon-refresh', handler: this.onRefresh, scope: this}
			,{text: 'Load all tag values', iconCls: 'icon-fetch-all', handler: this.onLoadAllTags, scope: this}
			,{text: 'Add a tag', iconCls: 'icon-tag-add', handler: this.onAddTag, scope: this}
		];
		this.action = new Ext.ux.grid.RowActions({
			actions: [
				{iconCls: 'icon-refresh', tooltip: 'Load tag value'}
				,{iconCls: 'icon-tag-remove', tooltip: 'Remove tag'}
			]
			,callbacks:{
				'icon-refresh': this.onRefreshRow.createDelegate(this)
				,'icon-tag-remove': this.onDeleteTag.createDelegate(this)
			}
		});
		this.colModel = new Ext.grid.ColumnModel({
			columns: [
				this.action
				,{id:'tag', header:'Tag', width: 230, dataIndex: 'tag', sortable: true}
				,{header: 'Value', width: 600, dataIndex: 'value', sortable: true, editor: {xtype: 'textfield'}}
			]
			,isCellEditable: function(col, row) {
				var record = gridstore.getAt(row);
				console.log(record);
				if (record.get('readonly')) {
					return false;
				}
				return Ext.grid.ColumnModel.prototype.isCellEditable.call(this, col, row);
			}
		});

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
	,onRefresh: function(){
		this.store.reload();
	}
	,onRefreshRow: function(g, r, action, row, col){
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
		oid = this.oid;
		Ext.Ajax.request({
			url: App.Config.base_remote + 'gettagvalue'
			,params: {oid: oid, tag: r.data.tag}
			,success: function(a){
				json = Ext.decode(a.responseText);
				if (json.type == 'primitive') {
					value = json.value;
				}
				else if (json.type == 'empty') {
					// TODO: Add color and/or icon
					value = 'empty';
				}
				else if (json.type == 'opaque') {
					value = 'Opaque value with content-type: "' + json.value + '" <a href="http://fluiddb.fluidinfo.com/objects/'+oid+'/'+r.data.tag+'" target="_blank">open</a>';
				}
				else {
					value = 'Unsupported type: "' + json.type + '"';
				}
				r.set('value', value);
				r.set('readonly', json.readonly);
				r.commit();
			}
		});
	}
});

Ext.reg('app.tagvaluesgrid', App.TagValuesGrid);

