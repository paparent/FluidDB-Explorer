App.TagValuesGrid = Ext.extend(Ext.grid.EditorGridPanel, {
	border: false
	,closable: true
	,title: 'Tag values'
	,loadMask: true
	,oid: null
	,viewConfig: {emptyText: 'Nothing to display'}
	,initComponent: function(){
		this.sm = new Ext.grid.RowSelectionModel({singleSelect:true});
		this.store = gridstore = new Ext.data.DirectStore({
			directFn: direct.TagValuesFetch
			,paramsAsHash: false
			,paramOrder: 'oid'
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
				,{header: 'Value', width: 600, dataIndex: 'value', sortable: true, renderer: {fn: this.aboutTagRenderer, scope: this}, editor: {xtype: 'textfield'}}
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

		direct.TagObject(this.oid, tag, value, function(){e.record.commit();});
	}
	,onAddTag: function(){
		var tag = window.prompt('Please enter full tag path');
		var value = window.prompt('Value');

		store = this.store;
		direct.TagObject(this.oid, tag,  value, function(){store.reload();});
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
		direct.DeleteTagValue(this.oid, r.data.tag, function(){g.store.remove(r);});
	}
	,setTag: function(r){
		r.set('value', '<em>loading...</em>');
		oid = this.oid;
		direct.GetTagValue(oid, r.data.tag, function(json){
			if (json.type == 'primitive') {
				value = json.value;
			}
			else if (json.type == 'empty') {
				// TODO: Add color and/or icon
				value = 'empty';
			}
			else if (json.type == 'opaque') {
				value = 'Opaque value with content-type: "' + json.value + '" <a href="http://' + App.Config.baseurl_instance + '/objects/'+oid+'/'+r.data.tag+'" target="_blank">open</a>';
			}
			else {
				value = 'Unsupported type: "' + json.type + '"';
			}
			r.set('value', value);
			r.set('readonly', json.readonly);
			r.commit();
		});
	}
	,aboutTagRenderer: function(value, metaData) {
		if (value.match(/^https?:\/\//)) {
			value = '<a href="' + value + '" target="_blank">' + value + '</a>';
		}
		return value;
	}
});

Ext.reg('app.tagvaluesgrid', App.TagValuesGrid);

