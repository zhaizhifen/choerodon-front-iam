import React, { Component } from 'react';
import { Button, Icon, Modal, Popover, Table } from 'choerodon-ui';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import Permission from 'PerComponent';
import Page, { Content, Header } from 'Page';
import EditUser from '../editUser';
import './UserHome.scss';

const { Sidebar } = Modal;

@inject('AppState')
@observer
class User extends Component {
  constructor(props) {
    super(props);
    this.linkToChange = this.linkToChange.bind(this);
    this.state = {
      open: false,
      edit: false,
      id: '',
      page: 0,
      isLoading: true,
      params: {},
      filters: {},
      pagination: {
        current: 1,
        pageSize: 10,
        total: '',
      },
      sort: 'id,desc',
      visible: false,
      selectedData: '',
    };
  }

  componentDidMount() {
    this.loadUser();
  }

  onEdit = (id) => {
    this.setState({
      visible: true,
      edit: true,
      selectedData: id,
    });
  };

  loadUser = (paginationIn, sortIn, filtersIn) => {
    const { AppState, UserStore } = this.props;
    const { pagination: paginationState, sort: sortState, filters: filtersState } = this.state;
    const { id } = AppState.currentMenuType;
    const pagination = paginationIn || paginationState;
    const sort = sortIn || sortState;
    const filters = filtersIn || filtersState;
    this.setState({
      pagination,
      filters,
    });
    UserStore.loadUsers(
      id,
      pagination,
      sort,
      filters,
    ).then((data) => {
      UserStore.setUsers(data.content);
      this.setState({
        pagination: {
          current: data.number + 1,
          pageSize: data.size,
          total: data.totalElements,
        },
      });
    })
      .catch(error => Choerodon.handleResponseError(error));
  };

  linkToChange = (url) => {
    const { history } = this.props;
    history.push(url);
  };

  openNewPage = () => {
    this.setState({
      visible: true,
      edit: false,
    });
  };

  handleDelete = () => {
    const { AppState, UserStore } = this.props;
    const menuType = AppState.currentMenuType;
    const organizationId = menuType.id;
    const { userId } = this.state;
    const lastDatas = UserStore.totalSize % 10;
    UserStore.deleteUserById(organizationId, userId).then((data) => {
      if (data.status === 204) {
        this.loadUser();
        Choerodon.prompt(Choerodon.getMessage('删除成功', 'Success'));
      }
      this.setState({
        open: false,
      });
    }).catch((error) => {
      Choerodon.handleResponseError(error);
      this.setState({
        open: false,
      });
    });
  };

  /*
  * 解锁
  * */
  handleUnLock = (record) => {
    const { AppState, UserStore } = this.props;
    const menuType = AppState.currentMenuType;
    const organizationId = menuType.id;
    UserStore.unLockUser(organizationId, record.id).then(() => {
      Choerodon.prompt('解锁成功');
      this.loadUser();
    }).catch((error) => {
      window.console.log(error);
    });
  };
  /*
  * 启用停用
  * */
  handleAble = (record) => {
    const { UserStore, AppState } = this.props;
    const menuType = AppState.currentMenuType;
    const organizationId = menuType.id;
    if (record.enabled) {
      // 禁用
      // debugger;
      UserStore.UnenableUser(organizationId, record.id, !record.enabled).then(() => {
        Choerodon.prompt('操作成功');
        this.loadUser();
      }).catch((error) => {
        Choerodon.prompt(`操作失败 ${error}`);
      });
    } else {
      UserStore.EnableUser(organizationId, record.id, !record.enabled).then(() => {
        Choerodon.prompt('操作成功');
        this.loadUser();
      }).catch((error) => {
        Choerodon.prompt(`操作失败 ${error}`);
      });
    }
  };
  changeLanguage = (code) => {
    if (code === 'zh_CN') {
      return '简体中文';
    } else if (code === 'en_US') {
      return '英语（美国）';
    }
    return null;
  };

  handlePageChange(pagination, filters, { field, order }, barFilters) {
    const sorter = [];
    if (field) {
      sorter.push(field);
      if (order === 'descend') {
        sorter.push('desc');
      }
    }
    this.loadUser(pagination, sorter.join(','), filters);
  }

  renderSideTitle() {
    if (this.state.edit) {
      return '修改用户';
    } else {
      return '创建用户';
    }
  }

  renderSideBar() {
    const { selectedData, edit, visible } = this.state;
    return (
      <EditUser
        id={selectedData}
        visible={visible}
        edit={edit}
        onRef={(node) => {
          this.editUser = node;
        }}
        onSubmit={() => {
          this.setState({
            visible: false,
          });
          this.loadUser();
        }}
      />
    );
  }

  render() {
    const { UserStore, AppState } = this.props;
    const { filters, pagination, visible, edit } = this.state;
    const menuType = AppState.currentMenuType;
    const organizationId = menuType.id;
    const orgname = menuType.name;
    let type;
    if (AppState.getType) {
      type = AppState.getType;
    } else if (sessionStorage.type) {
      type = sessionStorage.type;
    } else {
      type = menuType.type;
    }
    let data = [];
    if (UserStore.getUsers) {
      data = UserStore.users.slice();
    }
    const columns = [
      {
        title: Choerodon.getMessage('登录名', 'loginName'),
        dataIndex: 'loginName',
        key: 'loginName',
        filters: [],
        filteredValue: filters.loginName || [],
      }, {
        title: Choerodon.getMessage('用户名', 'userName'),
        key: 'realName',
        dataIndex: 'realName',
        filters: [],
        filteredValue: filters.realName || [],
      },
      {
        title: Choerodon.getMessage('认证来源', 'source'),
        key: 'ldap',
        render: (text, record) => (
          record.ldap
            ? <span>{Choerodon.getMessage('LDAP 用户', 'user ldap')}</span>
            : <span>{Choerodon.getMessage('非LDAP用户', 'user noLdap')}</span>
        ),
        filters: [
          {
            text: 'LDAP 用户',
            value: 'true',
          }, {
            text: '非LDAP用户',
            value: 'false',
          },
        ],
        filteredValue: filters.ldap || [],
      },
      {
        title: Choerodon.getMessage('语言', 'user language'),
        dataIndex: 'language',
        key: 'language',
        render: (text, record) => (
          this.changeLanguage(record.language)
        ),
        filters: [
          {
            text: '简体中文',
            value: 'zh_CN',
          }, {
            text: '英语（美国）',
            value: 'en_US',
          },
        ],
        filteredValue: filters.language || [],
      },
      {
        title: Choerodon.getMessage('启用状态', 'user statue'),
        key: 'enabled',
        render: (text, record) => (
          record.enabled
            ? <span>{Choerodon.getMessage('启用', 'enable')}</span>
            : <span>{Choerodon.getMessage('停用', 'disable')}</span>
        ),
        filters: [
          {
            text: '启用',
            value: 'true',
          }, {
            text: '停用',
            value: 'false',
          },
        ],
        filteredValue: filters.enabled || [],
      }, {
        title: Choerodon.getMessage('安全状态', 'locked'),
        key: 'locked',
        render: (text, record) => (
          record.locked
            ? <span>{Choerodon.getMessage('锁定', 'ok')}</span>
            : <span>{Choerodon.getMessage('正常', 'no')}</span>
        ),
        filters: [
          {
            text: '锁定',
            value: 'true',
          }, {
            text: '正常',
            value: 'false',
          },
        ],
        filteredValue: filters.locked || [],
      }, {
        title: '',
        className: 'operateIcons',
        key: 'action',
        width: '130px',
        render: (text, record) => (
          record.locked
            ? <div>
              <Permission
                service={['iam-service.organization-user.update']}
                type={type}
                organizationId={organizationId}
              >
                <Popover
                  trigger="hover"
                  content="修改"
                  placement="bottom"
                >
                  <Button
                    icon="mode_edit"
                    shape="circle"
                    onClick={this.onEdit.bind(this, record.id)}
                  />
                </Popover>
              </Permission>
              <Permission
                service={
                  [
                    'iam-service.organization-user.disableUser',
                    'iam-service.organization-user.enableUser',
                  ]
                }
                type={type}
                organizationId={organizationId}
              >
                <Popover
                  trigger="hover"
                  content={record.enabled ? '停用' : '启用'}
                  placement="bottom"
                >
                  <Button
                    icon={record.enabled ? 'remove_circle_outline' : 'finished'}
                    shape="circle"
                    onClick={this.handleAble.bind(this, record)}
                  />
                </Popover>
              </Permission>
              <Permission
                service={['iam-service.organization-user.unlock']}
                type={type}
                organizationId={organizationId}
              >
                <Popover
                  trigger="hover"
                  content="解锁"
                  placement="bottom"
                >
                  <Button icon="lock_open" shape="circle" onClick={this.handleUnLock.bind(this, record)} />
                </Popover>
              </Permission>
            </div> :
            <div>
              <Permission
                service={['iam-service.organization-user.update']}
                type={type}
                organizationId={organizationId}
              >
                <Popover
                  trigger="hover"
                  content="修改"
                  placement="bottom"
                >
                  <Button
                    icon="mode_edit"
                    shape="circle"
                    onClick={this.onEdit.bind(this, record.id)}
                  />
                </Popover>
              </Permission>
              <Permission
                service={
                  [
                    'iam-service.organization-user.disableUser',
                    'iam-service.organization-user.enableUser',
                  ]
                }
                type={type}
                organizationId={organizationId}
              >
                <Popover
                  trigger="hover"
                  content={record.enabled ? '停用' : '启用'}
                  placement="bottom"
                >
                  <Button
                    icon={record.enabled ? 'remove_circle_outline' : 'finished'}
                    shape="circle"
                    onClick={this.handleAble.bind(this, record)}
                  />
                </Popover>
              </Permission>
              <Permission
                service={['iam-service.organization-user.unlock']}
                type={type}
                organizationId={organizationId}
              >
                <Button icon="lock_open" shape="circle" disabled />
              </Permission>
            </div>
        ),
      }];
    return (
      <Page>
        <Header title={Choerodon.getMessage('用户管理', 'user management')}>
          <Permission
            service={['iam-service.organization-user.create']}
            type={type}
            organizationId={organizationId}
          >
            <Button
              onClick={this.openNewPage}
            >
              <Icon type="playlist_add" />
              {Choerodon.getMessage('创建用户', 'createUser')}
            </Button>
          </Permission>
          <Permission
            service={['iam-service.organization-user.list']}
            type={type}
            organizationId={organizationId}
          >
            <Button
              funcType="flat"
              onClick={() => this.loadUser()}
            >
              <Icon type="refresh" />
              {Choerodon.getMessage('刷新', 'flush')}
            </Button>
          </Permission>
        </Header>
        <Content
          title={`组织“${orgname}”的用户管理`}
          description="用户是平台的使用者。您可以在组织下创建用户，则用户属于这个组织。"
          link="http://choerodon.io/zh/docs/user-guide/system-configuration/tenant/user/"
        >
          <Table
            size="middle"
            pagination={pagination}
            columns={columns}
            dataSource={data}
            rowKey="id"
            onChange={this.handlePageChange.bind(this)}
            loading={UserStore.isLoading}
            filterBarPlaceholder="过滤表"
          />
          <Sidebar
            title={this.renderSideTitle()}
            visible={visible}
            onCancel={() => {
              this.setState({
                visible: false,
                selectedData: '',
              });
            }}
            onOk={() => {
              this.editUser.handleSubmit(event);
            }}
            cancelText="取消"
            okText={edit ? '保存' : '创建'}
          >
            {
              this.renderSideBar()
            }
          </Sidebar>
        </Content>
      </Page>
    );
  }
}

export default withRouter(User);
