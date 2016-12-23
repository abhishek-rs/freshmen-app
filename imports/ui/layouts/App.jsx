import React from 'react';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session'; // XXX: SESSION
import { Lists } from '../../api/lists/lists.js';
import UserMenu from '../components/UserMenu.jsx';
import ListList from '../components/ListList.jsx';
import ConnectionNotification from '../components/ConnectionNotification.jsx';
import Loading from '../components/Loading.jsx';
import Profiles from '../components/Profiles.jsx';
import { Link } from 'react-router';
import TutorSidebar from '../components/TutorSidebar.jsx';

const CONNECTION_ISSUE_TIMEOUT = 5000;

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      menuOpen: false,
      showConnectionIssue: false,
    };
    this.toggleMenu = this.toggleMenu.bind(this);
    this.logout = this.logout.bind(this);
  }

  componentDidMount() {
    setTimeout(() => {
      /* eslint-disable react/no-did-mount-set-state */
      this.setState({ showConnectionIssue: true });
    }, CONNECTION_ISSUE_TIMEOUT);
  }

  componentWillReceiveProps({ loading, children }) {
    // redirect / to a list once lists are ready
    /*if (!loading && !children) {
      const list = Lists.findOne();
      this.context.router.replace(`/lists/${list._id}`);
    }*/
    if (!loading && !children) {
      if (Meteor.user().role === 'tutor') {
        this.context.router.replace('/tutor');
      } else if (Meteor.user().role === 'coordinator') {
        this.context.router.replace('/coordinator');
      } else if (Meteor.user().role === 'student') {
        this.context.router.replace('/student');
      }
    }
  }

  toggleMenu(menuOpen = !Session.get('menuOpen')) {
    Session.set({ menuOpen });
  }

  logout() {
    Meteor.logout();

    //redirect to login page
    this.context.router.push('/login');
  }

  render() {
    const { showConnectionIssue } = this.state;
    const {
      user,
      connected,
      loading,
      lists,
      menuOpen,
      children,
      location,
    } = this.props;

    // eslint-disable-next-line react/jsx-no-bind
    const closeMenu = this.toggleMenu.bind(this, false);

    // clone route components with keys so that they can
    // have transitions
    const clonedChildren = children && React.cloneElement(children, {
      key: location.pathname,
    });

    const coordinatorMenu = (
      <li>
        <Link to="/coordinator/add-student">Add students</Link>
        <Link to="/coordinator/add-group">Add groups</Link>
      </li>
    );

    return (
      <div>
        <div className="navibar">
          <div className="container-fluid">
              <ul className="navibar-nav">
                <li><a className="site-title" href="/">Freshmen Guide</a></li>
                <li><a href="#">About</a></li>
                <li><a href="#">FAQ</a></li>
                <li><a href="#">Contact US</a></li>
                {!loading && user.role === 'coordinator' ? coordinatorMenu : ''}

              </ul>
          </div>
        </div>


      <div id="container" className={menuOpen ? 'menu-open' : ''}>
        <section id="menu">
          {/*<LanguageToggle />*/}
          <UserMenu user={user} logout={this.logout} />
          <Profiles/>
          <ListList lists={lists}/>
        </section>
        {showConnectionIssue && !connected
          ? <ConnectionNotification />
          : null}
        <div className="content-overlay" onClick={closeMenu} />
        <div id="content-container">
          <ReactCSSTransitionGroup
            transitionName="fade"
            transitionEnterTimeout={200}
            transitionLeaveTimeout={200}
          >
            {loading
              ? <Loading key="loading" />
              : clonedChildren}
          </ReactCSSTransitionGroup>

        </div>
        <div id="right-sidebar">
          {user && user.role === 'tutor'
            ? <TutorSidebar/>
            : ''
          }
        </div>
      </div>

      </div>

    );
  }
}

App.propTypes = {
  user: React.PropTypes.object,      // current meteor user
  connected: React.PropTypes.bool,   // server connection status
  loading: React.PropTypes.bool,     // subscription status
  menuOpen: React.PropTypes.bool,    // is side menu open?
  lists: React.PropTypes.array,      // all lists visible to the current user
  children: React.PropTypes.element, // matched child route component
  location: React.PropTypes.object,  // current router location
  params: React.PropTypes.object,    // parameters of the current route
};

App.contextTypes = {
  router: React.PropTypes.object,
};
