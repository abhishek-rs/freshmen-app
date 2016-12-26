import React from 'react';
import 'moment';
import Datetime from 'react-datetime';
import { Random } from 'meteor/random';
import BaseComponent from '../BaseComponent.jsx';
import update from 'immutability-helper';
import { displayError } from '../../helpers/errors.js';

import { insert } from '../../../api/posts/methods.js';

/**
 * css file must be import in js file,
 * if we want to import a css file to another stylesheet, change the extension to .less
 */
import 'react-datetime/css/react-datetime.css';

export default class PostCreate extends BaseComponent {
  constructor(props) {
    super(props);
    this.state = Object.assign(this.state, {
      post: {
        type: 'simple'
      },
      errors: {}
    });
    this.onPostCreate = this.onPostCreate.bind(this);
    this.onCreateTask = this.onCreateTask.bind(this);
    this.onCreateEvent = this.onCreateEvent.bind(this);
    this.onAddTask = this.onAddTask.bind(this);
    this.onRemoveTask = this.onRemoveTask.bind(this);
    this.onRemoveTaskItem = this.onRemoveTaskItem.bind(this);
    this.onEventDateChange = this.onEventDateChange.bind(this);
    this.onRemoveEvent = this.onRemoveEvent.bind(this);
  }

  onPostCreate(event) {
    event.preventDefault();
    console.log(this.state.post);
    const { post } = this.state;
    let newPost = {
      type: post.type,
      text: post.text.value
    };

    if (post.type === 'event') {
      newPost.event = {
        location: post.event.location.value,
        time: post.event.time.toDate()
      }
    } else if (post.type == 'task') {
      newPost.task = {
        todos: post.task.todos.map(todo => ({
          _id: todo._id,
          text: todo.text.value
        }))
      }
    }

    console.log(newPost);

    insert.call({
      type: newPost.type,
      text: newPost.text,
      event: newPost.event ? newPost.event : null,
      task: newPost.task ? newPost.task : null
    }, displayError)
      this.props.callBack(newPost)
  }

  onCreateTask() {
    if (this.state.post.type === 'task') {
      return;
    }
    let { post } = this.state;

    post.type = 'task';
    post.event = null;
    post.task = {
      todos: [
        {_id: Random.id(), text: 'Enter a task'}
      ],
      assignees: [{}]
    };

    this.setState({
      post: post
    });
  }

  onAddTask() {
    if (this.state.post.type !== 'task') {
      return;
    }

    const { post } = this.state;
    post.task.todos.push({_id: Random.id(), text: ''});

    this.setState({
      post: post
    });
  }

  onRemoveTask() {
    if (this.state.post.type !== 'task') {
      return;
    }

    this.setState({
      post: update(this.state.post, {
        type: {$set: 'simple'},
        task: {$set: null}
      })
    });
  }

  onRemoveTaskItem(index) {
    if (this.state.post.type !== 'task') {
      return;
    }

    this.setState({
      post: update(this.state.post, {
        task: {todos: {$splice: [[index,1]]}}
      })
    });
  }

  onCreateEvent() {
    if (this.state.post.type === 'event') {
      return;
    }

    this.setState({
      post: update(this.state.post, {
        type: {$set: 'event'},
        task: {$set: null},
        event: {$set: {
          location: '',
          time: null
        }}
      })
    });
  }

  onRemoveEvent() {
    if (this.state.post.type !== 'event') {
      return;
    }

    this.setState({
      post: update(this.state.post, {
        type: {$set: 'simple'},
        event: {$set: null}
      })
    });
  }
  onEventDateChange(date) {
    console.log(typeof date);
    if (typeof date === 'string' || !date.isValid()) {
      this.errors.invalidEventDate = true;
      return;
    }
    this.state.post.event.time = date;
  }

  renderTasksBox() {
    const { post } = this.state;
    let items = post.task.todos.map((todo, index) => {
      return (
        <div key={todo._id} className="row">
          <div className="col-sm-10">
            <input type="text"
                   className="form-control"
                   ref={(c) => {todo.text = c}}
                   placeholder="Enter a task"/>
          </div>
          {index > 0
            ? <i className="icon-close col-sm-2"
                 onClick={() => this.onRemoveTaskItem(index)}></i>
            : null}
        </div>
      );
    });
    return (
      <div className="post-task">
        {items}
        <button className="btn"
                type="button"
                onClick={this.onAddTask}>Add task</button>
        <a className="remove-btn" onClick={this.onRemoveTask}>
          <i className="icon-trash"></i>
          Remove task
        </a>
      </div>
    )
  }

  renderEventBox() {
    const { post } = this.state;
    const yesterday = Datetime.moment().subtract(1, 'day');
    const valid = function( current ){
      return current.isAfter( yesterday );
    };

    console.log(post);
    return (
      <div className="post-event">
        <input className="location form-control"
               type="text"
               ref={(c) => { post.event ? post.event.location = c : null}}/>
        <Datetime isValidDate={ valid }
                  timeConstraints={{minutes: {step: 15}}}
                  dateFormat="DD/MM/YYYY"
                  onChange={this.onEventDateChange} />
        <a className="remove-btn" onClick={this.onRemoveEvent}>
          <i className="icon-trash"></i>
          Remove event
        </a>
      </div>
    )
  }

  render() {
    const { post } = this.state;

    return (
      <div className="post-box">
        <form className="post-create" onSubmit={this.onPostCreate}>
          <textarea
            name="text"
            className="text form-control"
            ref={(c) => {post.text = c}}>
          </textarea>
          {post.type === 'task' ?
            this.renderTasksBox() :
            post.type === 'event' ? this.renderEventBox() : ''}
          <div className="post-types row">
            <div className="col-sm-10">
              <button className="btn" type="button" onClick={this.onCreateTask}>
                Task
              </button>
              <button className="btn" type="button" onClick={this.onCreateEvent}>
                Event
              </button>
            </div>
            <div className="col-sm-2">
              <button className="btn submit" type="submit">Post</button>
            </div>
          </div>
        </form>
      </div>
    );
  }
}
