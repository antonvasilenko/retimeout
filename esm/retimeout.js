import React from 'react';

const getDisplayName = WrappedComponent =>
  WrappedComponent.displayName || WrappedComponent.name || 'Component';

// with this one it is possible to wrap several times with different period and action
const retimeout = (refreshInSeconds, tickAction, resultMapper) => (DecoratedComponent) => {
  class Retimeout extends React.Component {
    state = {
      propsToAdd: {},
    };

    componentDidMount() {
      const interval = refreshInSeconds * 1000;
      this.tick();
      this.timer = setInterval(this.tick, interval);
    }

    componentWillUnmount() {
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
    }

    get childProps() {
      return {
        ...this.props,
        ...this.state.propsToAdd,
      };
    }

    tick = () => {
      if (typeof tickAction === 'function') {
        const pr = tickAction(this.childProps);
        if (pr.then) {
          pr.then(this.mapTickResult);
        } else {
          throw new Error('tickAction should return Promise');
        }
      } else {
        throw new Error('tickAction should be a function');
      }
    };

    mapTickResult = (res) => {
      if (!this.timer) {
        return; // component already unmounted (together with child)
      }
      if (resultMapper) {
        if (typeof resultMapper === 'string') {
          this.setState({
            propsToAdd: {
              [resultMapper]: res,
            },
          });
        } else if (typeof resultMapper === 'function') {
          this.setState({
            propsToAdd: resultMapper(res, this.childProps),
          });
        }
      }
    };

    render() {
      return React.createElement(DecoratedComponent, this.childProps);
    }
  }

  Retimeout.displayName = `retimeout(${getDisplayName(DecoratedComponent)})`;
  return Retimeout;
};

export default retimeout;
