App.ResultsGrid = Ext.extend(Ext.grid.GridPanel, {
	border: false
	,closable: true
	,title: 'Query results'
	,loadMask: true
	,query: null
	,iconCls: 'icon-tab-results'
	,viewConfig: {emptyText: 'Nothing to display'}
	,initComponent: function(){
		this.sm = new Ext.grid.RowSelectionModel({singleSelect:true});
		this.store = new Ext.data.DirectStore({
			directFn: direct.Query
			,paramsAsHash: false
			,paramOrder: 'query'
			,autoDestroy: true
			,root: 'ids'
			,fields: ['oid', 'about']
		});
		this.tbar = [
			{text:'Refresh',iconCls:'icon-refresh',scope:this,handler:this.doRefresh}
			,{text:'Load all about tags',iconCls:'icon-fetch-all',scope:this,handler:this.onLoadAll}
		];
		this.action = new Ext.ux.grid.RowActions({
			actions:[{iconCls:'icon-refresh',tooltip:'Refresh about tag'}]
			,callbacks:{
				'icon-refresh': this.onRefreshRow.createDelegate(this)
			}
		});
		this.columns = [
			this.action
			,{id:'oid', header:'Object ID', width: 230, dataIndex: 'oid', sortable: true}
			,{header: 'About tag', width: 600, dataIndex: 'about', sortable: true, renderer: {fn: this.aboutTagRenderer, scope: this}}
		];
		this.plugins = [this.action];
		App.ResultsGrid.superclass.initComponent.call(this);

		this.doRefresh();
		this.on('rowdblclick', this.onRowDblClick, this);
	}
	,aboutTagRenderer: function(value, metaData) {
		if (value.match(/^https?:\/\//)) {
			value = '<a href="' + value + '" target="_blank">' + value + '</a>';
		}
		return value;
	}
	,execQuery: function(a){
		this.store.load({params: {query:a}});
	}
	,doRefresh: function(){
		if (this.query) {
			this.setTitle('Query results: "' + this.query + '"');
			this.execQuery(this.query);
		}
	}
	,onRowDblClick: function(grid, rowIndex, e){
		var row = grid.store.getAt(rowIndex);
		var oid = row.data.oid;
		Ext.getCmp('mainpanel').openObject(oid);
	}
	,onLoadAll: function(a){
		this.store.each(this.setAboutTag);
	}
	,onRefreshRow: function(g, r, action, row, col){
		this.setAboutTag(r);
	}
	,setAboutTag: function(r){
		r.set('about', '<em>loading...</em>');
		direct.GetTagValue(r.data.oid, "fluiddb/about", function(json){
			r.set('about', json.value);
			r.commit();
		});
	}
});

Ext.reg('app.resultsgrid', App.ResultsGrid);

