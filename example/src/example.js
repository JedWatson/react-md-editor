var Editor = require('react-md-editor');
var marked = require('marked');
var React = require('react');
var ReactDOM = require('react-dom');

var App = React.createClass({
	getInitialState () {
		return {
			code: '# React Markdown Editor\n\n* A list\n\nSome **bold** and _italic_ text\n\n> A quote...\n\nBy [Jed Watson](https://github.com/JedWatson) and [Joss Mackison](https://github.com/jossmac)'
		};
	},
	updateCode (newCode) {
		this.setState({
			code: newCode
		});
	},
	render () {
		var preview = marked(this.state.code);
		return (
			<div className="example">
				<div className="hint">The editor is below, with default options. This example also uses marked to generate the preview on the right as you type.</div>
				<div className="editor">
					<Editor value={this.state.code} onChange={this.updateCode} />
				</div>
				<div className="preview" dangerouslySetInnerHTML={{__html: preview}} />
			</div>
		);
	}
});

ReactDOM.render(<App />, document.getElementById('app'));
