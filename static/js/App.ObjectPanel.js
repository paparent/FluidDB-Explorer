App.ObjectPanel = Ext.extend(Ext.Panel, {
	border: false
	,closable: true
	,layout: 'vbox'
	,initComponent: function(){
		this.items = [
			{border:false,layout:'fit',bodyStyle:'padding:5px;',html:"Object ID: " + this.oid}
			,new App.TagValuesGrid({oid: this.oid})
		];
		this.title = 'Object ' + this.oid;
		App.ObjectPanel.superclass.initComponent.call(this);
	}
});

Ext.reg('app.objectpanel', App.ObjectPanel);

