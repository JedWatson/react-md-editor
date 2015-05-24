var Editor = require('react-md-editor');
var marked = require('marked');
var React = require('react');

var App = React.createClass({
	getInitialState: function() {
		return {
			code: "# React Markdown Editor\n\n* A list\n\nSome **bold** and _italic_ text\n\n> A quote...\n\nBy [Jed Watson](https://github.com/JedWatson) and [Joss Mackison](https://github.com/jossmac)"
		};
	},
	updateCode: function(newCode) {
		this.setState({
			code: newCode
		});
	},

	render: function() {
		var preview = marked(this.state.code);
		return (
			<div className="example">
				<div className="editor">
					<Editor value={this.state.code} onChange={this.updateCode} />
				</div>
				<div className="preview" dangerouslySetInnerHTML={{__html: preview}} />
			</div>
		);
	}
});

React.render(<App />, document.getElementById('app'));
