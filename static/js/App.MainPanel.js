App.MainPanel = Ext.extend(Ext.TabPanel, {
	border: false
	,enableTabScroll: true
	,activeTab: 0
	,initComponent: function(){
		this.items = [{bodyStyle: 'padding:10px', contentEl: 'welcome', title: 'Welcome', iconCls: 'icon-welcome'}];
		App.MainPanel.superclass.initComponent.call(this);
	}
	,addTab: function(a){
		var b = this.add(a);
		this.setActiveTab(b);
	}
	,openObject: function(oid){
		var id = Ext.util.base64.encode('objectpanel-'+oid);
		var t = Ext.getCmp(id);
		if (!t) {
			t = new App.ObjectPanel({id: id, oid:oid});
			this.add(t);
		}
		this.setActiveTab(t);
	}
});

Ext.reg('app.mainpanel', App.MainPanel);

