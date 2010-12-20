App.Login = Ext.extend(Ext.Button, {
	text: 'Log in'
	,initComponent: function(){
		App.Login.superclass.initComponent.call(this);
		this.updateText(App.Config.username);
	}
	,handler: function(btn){
		var w = new App.LoginWindow();
		w.show();
		w.on('logged', function(username){
			w.destroy();
			btn.updateText(username);
		});
	}
	,updateText: function(username){
		if (username == 'Anonymous') {
			this.setText('Log in with your FluidDB ID');
		}
		else {
			this.setText('Logged in as: ' + username);
		}
		this.ownerCt.doLayout();
	}
});

Ext.reg('app.login', App.Login);

