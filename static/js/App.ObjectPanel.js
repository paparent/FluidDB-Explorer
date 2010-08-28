App.ObjectPanel = Ext.extend(Ext.Panel, {
	border: false
	,iconCls: 'icon-tab-object'
	,closable: true
	,layout: 'vbox'
	,initComponent: function(){
		this.items = [
			{border:true,margins:"5 5 5 5",frame:true,layout:'fit',bodyStyle:'padding:5px;',html:"Object ID: " + this.oid}
			,new App.TagValuesGrid({oid: this.oid, flex: 1})
		];
		this.title = 'Object ' + this.oid;
		App.ObjectPanel.superclass.initComponent.call(this);
	}
});

Ext.reg('app.objectpanel', App.ObjectPanel);

