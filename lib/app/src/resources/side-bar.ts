import {EventAggregator} from 'aurelia-event-aggregator';
import {autoinject} from 'aurelia-dependency-injection';
import {History} from 'aurelia-history';
import {ShowMenu, HideMenu, ActivateSection} from '../messages/shell';
import {Configuration, DocItem} from '../configuration';
import {DOM} from 'aurelia-pal';

@autoinject
export class SideBar {
  isActive = false;
  menu = null;

  $viewOne: HTMLElement;
  $viewTwo: HTMLElement;
  $currentView: HTMLElement = null;

  constructor(private config: Configuration, private ea: EventAggregator, private history: History) {
    ea.subscribe(ShowMenu, (msg:ShowMenu) => {
      let newItems = msg.item.items || msg.item.parent.items;
      let oldItems = this.menu && this.menu.items;
      let backward = isBackward(this.menu, msg.item);
      
      this.menu = {
        config: this.config,
        activeItem: msg.item,
        items: newItems,
        select: (item) => this.select(item)
      };

      if (!oldItems || newItems !== oldItems) {
        this.showMenu(this.menu, backward, !this.isActive && this.$currentView !== null);
      } else {
        this.$currentView['au'].controller.viewModel.menu = this.menu;
      }
      
      this.isActive = true;
      DOM.getElementById('app-footer').classList.add('with-sidebar');
    });

    ea.subscribe(HideMenu, (msg:HideMenu) => {
      this.isActive = false;
      DOM.getElementById('app-footer').classList.remove('with-sidebar');
    });
  }

  select(item: DocItem) {
    if (item === this.menu.activeItem) {
      return;
    } else if (item.dest) {
      this.history.navigate(item.dest);
    } else {
      this.ea.publish(new ActivateSection(item.id));
    }
  }

  showMenu(menu, backward = false, skipAnimation = false) {
    if (this.$currentView && !skipAnimation) {
      let newContent = this.$currentView === this.$viewOne ? this.$viewTwo : this.$viewOne;
      let oldContent = this.$currentView === this.$viewOne ? this.$viewOne : this.$viewTwo;
      oldContent.classList.remove('active');
      newContent.classList.add('active');
      this.$currentView = newContent;
      animate(menu, newContent, oldContent, backward);
    } else {
      this.$currentView = this.$viewOne;
      this.$currentView.classList.add('active');
      this.$viewOne.style.transition = 'none';
      this.$viewOne.style.transform = 'translate(0%, 0%)';
      this.$viewOne['au'].controller.viewModel.menu = menu;
      this.$viewTwo.style.transition = 'none';
      this.$viewTwo.style.transform = 'translate(100%, 0%)';
    }

    let nodeList = this.$currentView.querySelectorAll('ul li a');
    let ary = Array.prototype.slice.call(nodeList);
    ary.forEach(element => element.parentElement.classList.remove('active'));
  }
}

function isBackward(menu, nextItem: DocItem) {
  if (!menu) {
    return false;
  }

  let current = menu.activeItem;

  while(current) {
    if (current.parent === nextItem) {
      return true;
    }

    current = current.parent;
  }

  return false;
}

function animate(menu, newSidebar, oldSidebar, backward) {
  const transition = 'all .3s';

  if (backward) {
    newSidebar.style.transition = 'none';
    newSidebar.style.transform = 'translate(-100%, 0%)';
    newSidebar['au'].controller.viewModel.menu = menu;

    oldSidebar.style.transition = 'none';
    oldSidebar.style.transform = 'translate(0%, 0%)';

    setTimeout(() => {
      newSidebar.style.transition = transition;
      oldSidebar.style.transition = transition;

      newSidebar.style.transform = 'translate(0%, 0%)';
      oldSidebar.style.transform = 'translate(100%, 0%)';
    }, 100);
  } else {
    newSidebar.style.transition = 'none';
    newSidebar.style.transform = 'translate(100%, 0%)';
    newSidebar['au'].controller.viewModel.menu = menu;

    oldSidebar.style.transition = 'none';
    oldSidebar.style.transform = 'translate(0%, 0%)';

    setTimeout(() => {
      newSidebar.style.transition = transition;
      oldSidebar.style.transition = transition;

      newSidebar.style.transform = 'translate(0%, 0%)';
      oldSidebar.style.transform = 'translate(-100%, 0%)';
    }, 100);
  }
}
