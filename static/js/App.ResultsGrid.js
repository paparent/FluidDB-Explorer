App.ResultsGrid = Ext.extend(Ext.grid.GridPanel, {
	border: false
	,closable: true
	,title: 'Query results'
	,loadMask: true
	,query: null
	,sm: new Ext.grid.RowSelectionModel({singleSelect:true})
	,initComponent: function(){
		this.store = new Ext.data.JsonStore({
			url: '/remote/query'
			,root: 'ids'
			,fields: ['oid', 'about']
		});
		this.tbar = [
			{text:'Load all about tags',scope:this,handler:this.onLoadAll}
		];
		this.action = new Ext.ux.grid.RowActions({
			header: 'Actions'
			,actions:[{iconCls:'icon-refresh',tooltip:'Load about tag'}]
			,callbacks:{
				'icon-refresh': this.onRefresh.createDelegate(this)
			}
		});
		this.columns = [
			{id:'oid', header:'Object ID', width: 230, dataIndex: 'oid'}
			,{header: 'About', width: 600, dataIndex: 'about'}
			,this.action
		];
		this.plugins = [this.action];
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
		this.store.each(this.setAboutTag);
	}
	,onRefresh: function(g, r, action, row, col){
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

