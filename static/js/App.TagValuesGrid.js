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

