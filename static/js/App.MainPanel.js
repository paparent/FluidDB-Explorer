App.MainPanel = Ext.extend(Ext.TabPanel, {
	border: false
	,enableTabScroll: true
	,activeTab: 0
	,initComponent: function(){
		this.items = [{bodyStyle: 'padding:10px', contentEl: 'welcome', title: 'Welcome'}];
		App.MainPanel.superclass.initComponent.call(this);
	}
	,addTab: function(a){
		var b = this.add(a);
		this.setActiveTab(b);
	}
	,openObject: function(oid){
		this.addTab(new App.ObjectPanel({oid:oid}));
	}
});

Ext.reg('app.mainpanel', App.MainPanel);

