App.ResultsGrid = Ext.extend(Ext.grid.GridPanel, {
	border: false
	,closable: true
	,title: 'Query results'
	,loadMask: true
	,query: null
	,viewConfig: {emptyText: 'Nothing to display'}
	,sm: new Ext.grid.RowSelectionModel({singleSelect:true})
	,initComponent: function(){
		this.store = new Ext.data.JsonStore({
			url: '/remote/query'
			,autoDestroy: true
			,root: 'ids'
			,fields: ['oid', 'about']
		});
		this.tbar = [
			{text:'Reload',scope:this,handler:this.doRefresh}
			,{text:'Load all about tags',scope:this,handler:this.onLoadAll}
		];
		this.action = new Ext.ux.grid.RowActions({
			header: 'Actions'
			,actions:[{iconCls:'icon-refresh',tooltip:'Load about tag'}]
			,callbacks:{
				'icon-refresh': this.onRefreshRow.createDelegate(this)
			}
		});
		this.columns = [
			this.action
			,{id:'oid', header:'Object ID', width: 230, dataIndex: 'oid', sortable: true}
			,{header: 'About', width: 600, dataIndex: 'about', sortable: true}
		];
		this.plugins = [this.action];
		App.ResultsGrid.superclass.initComponent.call(this);

		this.doRefresh();
		this.on('rowdblclick', this.onRowDblClick, this);
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
	,onRowDblClick: function(a, b, c){
		var row = a.getSelectionModel().getSelected();
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
		Ext.Ajax.request({
			url: '/remote/gettagvalue'
			,params: {oid: r.data.oid, tag: "fluiddb/about"}
			,success: function(a){
				r.set('about', a.responseText);
				r.commit();
			}
		});
	}
});

Ext.reg('app.resultsgrid', App.ResultsGrid);

