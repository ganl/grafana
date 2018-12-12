// Libraries
import React, { PureComponent } from 'react';

// Utils & Services
import { getAngularLoader, AngularComponent } from 'app/core/services/AngularLoader';

// Components
import { EditorTabBody } from './EditorTabBody';
import { VizTypePicker } from './VizTypePicker';

// Types
import { PanelModel } from '../panel_model';
import { DashboardModel } from '../dashboard_model';
import { PanelPlugin } from 'app/types/plugins';

interface Props {
  panel: PanelModel;
  dashboard: DashboardModel;
  plugin: PanelPlugin;
  angularPanel?: AngularComponent;
  onTypeChanged: (newType: PanelPlugin) => void;
}

interface State {
  isVizPickerOpen: boolean;
  searchQuery: string;
}

export class VisualizationTab extends PureComponent<Props, State> {
  element: HTMLElement;
  angularOptions: AngularComponent;
  searchInput: HTMLElement;

  constructor(props) {
    super(props);

    this.state = {
      isVizPickerOpen: false,
    };
  }

  getPanelDefaultOptions = () => {
    const { panel, plugin } = this.props;

    if (plugin.exports.PanelDefaults) {
      return panel.getOptions(plugin.exports.PanelDefaults.options);
    }

    return panel.getOptions(plugin.exports.PanelDefaults);
  };

  renderPanelOptions() {
    const { plugin, angularPanel } = this.props;
    const { PanelOptions } = plugin.exports;

    if (angularPanel) {
      return <div ref={element => (this.element = element)} />;
    }

    if (PanelOptions) {
      return <PanelOptions options={this.getPanelDefaultOptions()} onChange={this.onPanelOptionsChanged} />;
    } else {
      return <p>Visualization has no options</p>;
    }
  }

  componentDidMount() {
    if (this.shouldLoadAngularOptions()) {
      this.loadAngularOptions();
    }
  }

  componentDidUpdate(prevProps: Props) {
    if (this.props.plugin !== prevProps.plugin) {
      this.cleanUpAngularOptions();
    }

    if (this.shouldLoadAngularOptions()) {
      this.loadAngularOptions();
    }
  }

  shouldLoadAngularOptions() {
    return this.props.angularPanel && this.element && !this.angularOptions;
  }

  loadAngularOptions() {
    const { angularPanel } = this.props;

    const scope = angularPanel.getScope();

    // When full page reloading in edit mode the angular panel has on fully compiled & instantiated yet
    if (!scope.$$childHead) {
      setTimeout(() => {
        this.forceUpdate();
      });
      return;
    }

    const panelCtrl = scope.$$childHead.ctrl;

    let template = '';
    for (let i = 0; i < panelCtrl.editorTabs.length; i++) {
      template +=
        `
      <div class="form-section" ng-cloak>` +
        (i > 0 ? `<div class="form-section__header">{{ctrl.editorTabs[${i}].title}}</div>` : '') +
        `<div class="form-section__body">
          <panel-editor-tab editor-tab="ctrl.editorTabs[${i}]" ctrl="ctrl"></panel-editor-tab>
        </div>
      </div>
      `;
    }

    const loader = getAngularLoader();
    const scopeProps = { ctrl: panelCtrl };

    this.angularOptions = loader.load(this.element, scopeProps, template);
  }

  componentWillUnmount() {
    this.cleanUpAngularOptions();
  }

  cleanUpAngularOptions() {
    if (this.angularOptions) {
      this.angularOptions.destroy();
      this.angularOptions = null;
    }
  }

  onPanelOptionsChanged = (options: any) => {
    this.props.panel.updateOptions(options);
    this.forceUpdate();
  };

  onOpenVizPicker = () => {
    this.setState({ isVizPickerOpen: true });
  };

  renderToolbar = () => {
    const { plugin } = this.props;

    if (this.state.isVizPickerOpen) {
      return (
        <label className="gf-form--has-input-icon">
          <input
            type="text"
            className="gf-form-input width-13"
            placeholder=""
            ref={elem => (this.searchInput = elem)}
          />
          <i className="gf-form-input-icon fa fa-search" />
        </label>
      );
    } else {
      return (
        <div className="toolbar__main" onClick={this.onOpenVizPicker}>
          <img className="toolbar__main-image" src={plugin.info.logos.small} />
          <div className="toolbar__main-name">{plugin.name}</div>
          <i className="fa fa-caret-down" />
        </div>
      );
    }
  };

  render() {
    const { plugin, onTypeChanged } = this.props;
    const { isVizPickerOpen } = this.state;

    const panelHelp = {
      title: '',
      icon: 'fa fa-question',
      render: () => <h2>Help</h2>,
    };

    return (
      <EditorTabBody heading="Visualization" renderToolbar={this.renderToolbar} toolbarItems={[panelHelp]}>
        {isVizPickerOpen && <VizTypePicker current={plugin} onTypeChanged={onTypeChanged} />}
        {this.renderPanelOptions()}
      </EditorTabBody>
    );
  }
}
