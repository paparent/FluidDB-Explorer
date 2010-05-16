App.ObjectPanel = Ext.extend(Ext.Panel, {
	border: false
	,closable: true
	,layout: 'fit'
	,initComponent: function(){
		App.ObjectPanel.superclass.initComponent.call(this);
		this.setTitle('Object ' + this.oid);
		this.add(new App.TagValuesGrid({oid: this.oid}));
	}
});

Ext.reg('app.objectpanel', App.ObjectPanel);

