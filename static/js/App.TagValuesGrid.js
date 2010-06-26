App.TagValuesGrid = Ext.extend(Ext.grid.EditorGridPanel, {
	border: false
	,closable: true
	,title: 'Tag values'
	,loadMask: true
	,oid: null
	,sm: new Ext.grid.RowSelectionModel({singleSelect:true})
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
		this.action = new Ext.ux.grid.RowActions({
			header: 'Actions'
			,actions:[{iconCls:'icon-refresh',tooltip:'Load tag value'}]
			,callbacks:{
				'icon-refresh': this.onRefresh.createDelegate(this)
			}
		});
		this.columns = [
			{id:'tag', header:'Tag', width: 230, dataIndex: 'tag'}
			,{header: 'Value', width: 600, dataIndex: 'value', editor: {xtype: 'textfield'}}
			,this.action
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
		this.store.each(this.setTag.createDelegate(this));
	}
	,onRefresh: function(g, r, action, row, col){
		this.setTag(r);
	}
	,setTag: function(r){
		r.set('value', '<em>loading...</em>');
		Ext.Ajax.request({
			url: '/remote/gettagvalue'
			,params: {oid: this.oid, tag: r.data.tag}
			,success: function(a){
				r.set('value', a.responseText);
				r.commit();
			}
		});
	}
});

Ext.reg('app.tagvaluesgrid', App.TagValuesGrid);

