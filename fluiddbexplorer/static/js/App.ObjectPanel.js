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
		this.title = 'Object ' + this.oid.split('-')[0];
		this.tabTip = this.oid;

		App.ObjectPanel.superclass.initComponent.call(this);

	}
	,afterRender: function(){
		App.ObjectPanel.superclass.afterRender.apply(this, arguments);
		this.body.on('click', this.onClick, this);

		var panel = this;

		direct.GetTagValue(this.oid, "fluiddb/about", function(json){
			value = json.value;
			if (value.match(/^https?:\/\//)) {
				value = '<a href="' + value + '" target="_blank">' + value + '</a>';
			}
			txt = "Object ID: " + panel.oid + "<br><br>About: " + value;
			txt += '<br><br><a href="http://abouttag.appspot.com/id/butterfly/'+panel.oid+'" target="_blank">View visual representation</a>';
			panel.items.items[0].update(txt);
			panel.doLayout();
		});
	}
	,onClick: function(e, target){
		if (target = e.getTarget('a', 3)) {
			e.stopEvent();
			win = new Ext.ux.ManagedIFrame.Window({frame:true,defaultSrc:target.href, width:800, height:500});
			win.show();
		}
	}

});

Ext.reg('app.objectpanel', App.ObjectPanel);

