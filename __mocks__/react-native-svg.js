const React = require('react');

function createMockComponent(displayName) {
	const Comp = React.forwardRef((props, ref) => React.createElement(displayName, { ref, ...props }, props.children));
	Comp.displayName = displayName;
	return Comp;
}

module.exports = {
	__esModule: true,
	default: createMockComponent('Svg'),
	Svg: createMockComponent('Svg'),
	Path: createMockComponent('Path'),
	Circle: createMockComponent('Circle'),
	Rect: createMockComponent('Rect'),
	G: createMockComponent('G'),
	Defs: createMockComponent('Defs'),
	LinearGradient: createMockComponent('LinearGradient'),
	Stop: createMockComponent('Stop'),
};


