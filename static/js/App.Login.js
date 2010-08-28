App.Login = Ext.extend(Ext.Button, {
	text: 'Logged as: ' + App.Config.username
	,initComponent: function(){
		App.Login.superclass.initComponent.call(this);
	}
	,handler: function(btn){
		var w = new App.LoginWindow();
		w.show();
		w.on('logged', function(username){
			w.destroy();
			btn.setText('Logged as: ' + username);
			btn.ownerCt.doLayout();
		});
	}
});

Ext.reg('app.login', App.Login);

