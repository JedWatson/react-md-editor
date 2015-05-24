var React = require('react');
var Editor = require('react-md-editor');

var App = React.createClass({
	getInitialState: function() {
		return {
			code: "# React Markdown Editor\n\n* A list\n\nSome **bold** and _italic_ text\n\n> A quote...\n\nBy [Jed Watson](https://github.com/JedWatson)"
		};
	},
	updateCode: function(newCode) {
		this.setState({
			code: newCode
		});
	},
	render: function() {
		return <Editor value={this.state.code} onChange={this.updateCode} />
	}
});

React.render(<App />, document.getElementById('app'));
