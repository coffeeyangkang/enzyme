import React from 'react';
import sinon from 'sinon';
import { expect } from 'chai';
import { elementToTree } from 'enzyme-adapter-utils';
import {
  hasClassName,
  treeForEach,
  treeFilter,
  pathToNode,
  getTextFromNode,
  nodeHasProperty
} from 'enzyme/build/RSTTraversal';

import './_helpers/setupAdapters';
import { describeIf } from './_helpers';
import { REACT013 } from './_helpers/version';

const $ = elementToTree;

describe('RSTTraversal', () => {
  describe('hasClassName', () => {
    it('should work for standalone classNames', () => {
      const node = $(<div className="foo" />);
      expect(hasClassName(node, 'foo')).to.equal(true);
      expect(hasClassName(node, 'bar')).to.equal(false);
    });

    it('should work for multiple classNames', () => {
      const node = $(<div className="foo bar baz" />);
      expect(hasClassName(node, 'foo')).to.equal(true);
      expect(hasClassName(node, 'bar')).to.equal(true);
      expect(hasClassName(node, 'baz')).to.equal(true);
      expect(hasClassName(node, 'bax')).to.equal(false);
    });

    it('should also allow hyphens', () => {
      const node = $(<div className="foo-bar" />);
      expect(hasClassName(node, 'foo-bar')).to.equal(true);
    });

    it('should work if className has a function in toString property', () => {
      function classes() {}
      classes.toString = () => 'foo-bar';
      const node = $(<div className={classes} />);
      expect(hasClassName(node, 'foo-bar')).to.equal(true);
    });
  });

  describe('nodeHasProperty', () => {
    it('should find properties', () => {
      function noop() {}
      const node = $(<div onChange={noop} title="foo" />);

      expect(nodeHasProperty(node, 'onChange')).to.equal(true);
      expect(nodeHasProperty(node, 'title', 'foo')).to.equal(true);
    });

    it('should not match on html attributes', () => {
      const node = $(<div htmlFor="foo" />);

      expect(nodeHasProperty(node, 'for', 'foo')).to.equal(false);
    });

    it('should not find undefined properties', () => {
      const node = $(<div title={undefined} />);

      expect(nodeHasProperty(node, 'title')).to.equal(false);
    });

    it('should parse booleans', () => {
      expect(nodeHasProperty(<div foo />, 'foo', true)).to.equal(true);
      expect(nodeHasProperty(<div foo />, 'foo', false)).to.equal(false);
      expect(nodeHasProperty(<div foo />, 'foo', 'true')).to.equal(false);
      expect(nodeHasProperty(<div foo={false} />, 'foo', false)).to.equal(true);
      expect(nodeHasProperty(<div foo={false} />, 'foo', true)).to.equal(false);
      expect(nodeHasProperty(<div foo={false} />, 'foo', 'false')).to.equal(false);
    });

    it('should parse numeric literals', () => {
      expect(nodeHasProperty(<div foo={2.3} />, 'foo', 2.3)).to.equal(true);
      expect(nodeHasProperty(<div foo={2} />, 'foo', 2)).to.equal(true);
      expect(nodeHasProperty(<div foo={2} />, 'foo', '2abc')).to.equal(false);
      expect(nodeHasProperty(<div foo={2} />, 'foo', 'abc2')).to.equal(false);
      expect(nodeHasProperty(<div foo={-2} />, 'foo', -2)).to.equal(true);
      expect(nodeHasProperty(<div foo={2e8} />, 'foo', 2e8)).to.equal(true);
      expect(nodeHasProperty(<div foo={Infinity} />, 'foo', Infinity)).to.equal(true);
      expect(nodeHasProperty(<div foo={-Infinity} />, 'foo', -Infinity)).to.equal(true);
    });

    it('should parse zeroes properly', () => {
      expect(nodeHasProperty(<div foo={0} />, 'foo', 0)).to.equal(true);
      expect(nodeHasProperty(<div foo={0} />, 'foo', +0)).to.equal(true);
      expect(nodeHasProperty(<div foo={-0} />, 'foo', -0)).to.equal(true);
      expect(nodeHasProperty(<div foo={-0} />, 'foo', 0)).to.equal(false);
      expect(nodeHasProperty(<div foo={0} />, 'foo', -0)).to.equal(false);
      expect(nodeHasProperty(<div foo={1} />, 'foo', 0)).to.equal(false);
      expect(nodeHasProperty(<div foo={2} />, 'foo', -0)).to.equal(false);
    });

    it('should work with empty strings', () => {
      expect(nodeHasProperty(<div foo="" />, 'foo', '')).to.equal(true);
      expect(nodeHasProperty(<div foo={''} />, 'foo', '')).to.equal(true);
      expect(nodeHasProperty(<div foo={'bar'} />, 'foo', '')).to.equal(false);
    });

    it('should work with NaN', () => {
      expect(nodeHasProperty(<div foo={NaN} />, 'foo', NaN)).to.equal(true);
      expect(nodeHasProperty(<div foo={0} />, 'foo', NaN)).to.equal(false);
    });

    it('should work with null', () => {
      expect(nodeHasProperty(<div foo={null} />, 'foo', null)).to.equal(true);
      expect(nodeHasProperty(<div foo={0} />, 'foo', null)).to.equal(false);
    });

    it('should work with false', () => {
      expect(nodeHasProperty(<div foo={false} />, 'foo', false)).to.equal(true);
      expect(nodeHasProperty(<div foo={0} />, 'foo', false)).to.equal(false);
    });

    it('should work with ±Infinity', () => {
      expect(nodeHasProperty(<div foo={Infinity} />, 'foo', Infinity)).to.equal(true);
      expect(nodeHasProperty(<div foo={Infinity} />, 'foo', +Infinity)).to.equal(true);
      expect(nodeHasProperty(<div foo={Infinity} />, 'foo', -Infinity)).to.equal(false);
      expect(nodeHasProperty(<div foo={Infinity} />, 'foo', 'Infinity')).to.equal(false);
      expect(nodeHasProperty(<div foo={Infinity} />, 'foo', NaN)).to.equal(false);
      expect(nodeHasProperty(<div foo={0} />, 'foo', Infinity)).to.equal(false);
      expect(nodeHasProperty(<div foo={-Infinity} />, 'foo', -Infinity)).to.equal(true);
      expect(nodeHasProperty(<div foo={-Infinity} />, 'foo', Infinity)).to.equal(false);
      expect(nodeHasProperty(<div foo={-Infinity} />, 'foo', Infinity)).to.equal(false);
      expect(nodeHasProperty(<div foo={-Infinity} />, 'foo', '-Infinity')).to.equal(false);
      expect(nodeHasProperty(<div foo={-Infinity} />, 'foo', NaN)).to.equal(false);
      expect(nodeHasProperty(<div foo={NaN} />, 'foo', Infinity)).to.equal(false);
      expect(nodeHasProperty(<div foo={NaN} />, 'foo', -Infinity)).to.equal(false);
      expect(nodeHasProperty(<div foo={0} />, 'foo', -Infinity)).to.equal(false);
    });
  });

  describe('treeForEach', () => {
    it('should be called once for a leaf node', () => {
      const spy = sinon.spy();
      const node = $(<div />);
      treeForEach(node, spy);
      expect(spy.calledOnce).to.equal(true);
    });

    it('should handle a single child', () => {
      const spy = sinon.spy();
      const node = $((
        <div>
          <div />
        </div>
      ));
      treeForEach(node, spy);
      expect(spy.callCount).to.equal(2);
    });

    it('should handle several children', () => {
      const spy = sinon.spy();
      const node = $((
        <div>
          <div />
          <div />
        </div>
      ));
      treeForEach(node, spy);
      expect(spy.callCount).to.equal(3);
    });

    it('should handle multiple hierarchies', () => {
      const spy = sinon.spy();
      const node = $((
        <div>
          <div>
            <div />
            <div />
          </div>
        </div>
      ));
      treeForEach(node, spy);
      expect(spy.callCount).to.equal(4);
    });

    it('should handle array children', () => {
      const spy = sinon.spy();
      const twoDivArray = [
        <div key="a" />,
        <div key="b" />,
      ];
      const divA = $(<div key="a" />);
      const divB = $(<div key="b" />);
      const node = $((
        <div>
          {twoDivArray}
        </div>
      ));
      treeForEach(node, spy);
      expect(spy.callCount).to.equal(3);
      const nodes = spy.args.map(arg => arg[0]);
      expect(nodes).to.deep.equal([node, divA, divB]);
    });

    it('should handle array siblings', () => {
      const spy = sinon.spy();
      const array1 = [
        <div key="a" />,
        <div key="b" />,
      ];
      const array2 = [
        <div key="c" />,
        <div key="d" />,
      ];
      const divA = $(<div key="a" />);
      const divB = $(<div key="b" />);
      const divC = $(<div key="c" />);
      const divD = $(<div key="d" />);
      const node = $((
        <div>
          {array1}
          {array2}
        </div>
      ));
      treeForEach(node, spy);
      expect(spy.callCount).to.equal(5);
      const nodes = spy.args.map(arg => arg[0]);
      expect(nodes).to.deep.equal([node, divA, divB, divC, divD]);
    });

    it('should handle Map children', () => {
      const spy = sinon.spy();
      const twoDivMap = new Map([
        [<div key="a" />],
        [<div key="b" />],
      ]);
      const divA = $(<div key="a" />);
      const divB = $(<div key="b" />);
      const node = $((
        <div>
          {twoDivMap}
        </div>
      ));
      treeForEach(node, spy);
      expect(spy.callCount).to.equal(3);
      const nodes = spy.args.map(arg => arg[0]);
      expect(nodes).to.deep.equal([node, divA, divB]);
    });

    it('should handle Map siblings', () => {
      const spy = sinon.spy();
      const map1 = new Map([
        [<div key="a" />],
        [<div key="b" />],
      ]);
      const map2 = new Map([
        [<div key="c" />],
        [<div key="d" />],
      ]);
      const divA = $(<div key="a" />);
      const divB = $(<div key="b" />);
      const divC = $(<div key="c" />);
      const divD = $(<div key="d" />);
      const node = $((
        <div>
          {map1}
          {map2}
        </div>
      ));
      treeForEach(node, spy);
      expect(spy.callCount).to.equal(5);
      const nodes = spy.args.map(arg => arg[0]);
      expect(nodes).to.deep.equal([node, divA, divB, divC, divD]);
    });

    it('should handle Set children', () => {
      const spy = sinon.spy();
      const twoDivSet = new Set([
        <div key="a" />,
        <div key="b" />,
      ]);
      const divA = $(<div key="a" />);
      const divB = $(<div key="b" />);
      const node = $((
        <div>
          {twoDivSet}
        </div>
      ));
      treeForEach(node, spy);
      expect(spy.callCount).to.equal(3);
      const nodes = spy.args.map(arg => arg[0]);
      expect(nodes).to.deep.equal([node, divA, divB]);
    });

    it('should handle Set siblings', () => {
      const spy = sinon.spy();
      const set1 = new Set([
        <div key="a" />,
        <div key="b" />,
      ]);
      const set2 = new Set([
        <div key="c" />,
        <div key="d" />,
      ]);
      const divA = $(<div key="a" />);
      const divB = $(<div key="b" />);
      const divC = $(<div key="c" />);
      const divD = $(<div key="d" />);
      const node = $((
        <div>
          {set1}
          {set2}
        </div>
      ));
      treeForEach(node, spy);
      expect(spy.callCount).to.equal(5);
      const nodes = spy.args.map(arg => arg[0]);
      expect(nodes).to.deep.equal([node, divA, divB, divC, divD]);
    });

    it('should not get trapped from empty strings', () => {
      const spy = sinon.spy();
      const node = $((
        <div>
          <p>{''}</p>
        </div>
      ));
      treeForEach(node, spy);
      expect(spy.callCount).to.equal(3);
    });

    it('should pass in the node', () => {
      const spy = sinon.spy();
      const node = $((
        <div>
          <button />
          <nav>
            <input />
          </nav>
        </div>
      ));
      treeForEach(node, spy);
      expect(spy.callCount).to.equal(4);
      expect(spy.args[0][0].type).to.equal('div');
      expect(spy.args[1][0].type).to.equal('button');
      expect(spy.args[2][0].type).to.equal('nav');
      expect(spy.args[3][0].type).to.equal('input');
    });

  });

  describe('treeFilter', () => {
    const tree = $((
      <div>
        <button />
        <button />
        <nav>
          <input />
        </nav>
      </div>
    ));

    it('should return an empty array for falsy test', () => {
      expect(treeFilter(tree, () => false).length).to.equal(0);
    });

    it('should return the full array for truthy test', () => {
      expect(treeFilter(tree, () => true).length).to.equal(5);
    });

    it('should filter for truthiness', () => {
      expect(treeFilter(tree, node => node.type === 'nav').length).to.equal(1);
      expect(treeFilter(tree, node => node.type === 'button').length).to.equal(2);
    });

  });

  describe('pathToNode', () => {
    it('should return null if no queue length', () => {
      const result = pathToNode({}, []);

      expect(result).to.equal(null);
    });

    it('should return trees from the root node', () => {
      const node = <label htmlFor="foo" />;
      const tree = $((
        <div>
          <button />
          <nav>
            {node}
            <input id="foo" />
          </nav>
        </div>
      ));

      const nodeInTree = tree.rendered[1].rendered[0];
      const result = pathToNode(nodeInTree, tree);
      expect(result.length).to.equal(2);
      expect(result[0].type).to.equal('div');
      expect(result[1].type).to.equal('nav');
    });

    it('should return trees from the root node except the sibling node', () => {
      const node = <label htmlFor="foo" />;
      const tree = $((
        <div>
          <button />
          <nav>
            {node}
            <div><input id="foo" /></div>
          </nav>
        </div>
      ));

      const nodeInTree = tree.rendered[1].rendered[0];
      const result = pathToNode(nodeInTree, tree);
      expect(result.length).to.equal(2);
      expect(result[0].type).to.equal('div');
      expect(result[1].type).to.equal('nav');
    });

  });

  describe('getTextFromNode', () => {
    it('should return empty string for nodes which do not exist', () => {
      const result = getTextFromNode(null);
      expect(result).to.equal('');
    });

    it('should return displayName for functions that provides one', () => {
      class Subject extends React.Component {
        render() {
          return (
            <div />
          );
        }
      }
      Subject.displayName = 'CustomSubject';
      const node = $(<Subject />);
      const result = getTextFromNode(node);
      expect(result).to.equal('<CustomSubject />');
    });

    it('should return function name if displayName is not provided', () => {
      class Subject extends React.Component {
        render() {
          return (
            <div />
          );
        }
      }
      const node = $(<Subject />);
      const result = getTextFromNode(node);
      expect(result).to.equal('<Subject />');
    });

    describeIf(!REACT013, 'stateless function components', () => {

      it('should return displayName for functions that provides one', () => {
        const Subject = () => <div />;
        Subject.displayName = 'CustomSubject';

        const node = $(<Subject />);
        const result = getTextFromNode(node);
        expect(result).to.equal('<CustomSubject />');
      });

      it('should return function name if displayName is not provided', () => {
        const Subject = () => <div />;

        const node = $(<Subject />);
        const result = getTextFromNode(node);
        expect(result).to.equal('<Subject />');
      });
    });
  });
});
