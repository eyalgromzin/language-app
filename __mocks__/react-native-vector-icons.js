const React = require('react');

function createIconMock(displayName) {
  const Icon = (props) => React.createElement('Icon', props);
  Icon.displayName = displayName;
  return Icon;
}

module.exports = createIconMock('RNVectorIconMock');


