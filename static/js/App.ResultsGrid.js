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
});

Ext.reg('app.resultsgrid', App.ResultsGrid);

