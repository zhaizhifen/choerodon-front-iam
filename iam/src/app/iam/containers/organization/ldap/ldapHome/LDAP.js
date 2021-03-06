import React, { Component } from 'react';
import { Checkbox, Form, Input, Button, Select, Radio } from 'choerodon-ui';
import { withRouter } from 'react-router-dom';
import Permission from 'PerComponent';
import { observer, inject } from 'mobx-react';
import Page, { Content, Header } from 'Page';
import LoadingBar from '../../../../components/loadingBar';
import './LDAP.scss';

const { TextArea } = Input;
const RadioGroup = Radio.Group;
const FormItem = Form.Item;
const Option = Select.Option;

@inject('AppState')
@observer
class LDAP extends Component {
  constructor(props) {
    super(props);
    this.loadLDAP = this.loadLDAP.bind(this);
    this.state = this.getInitState();
  }

  componentDidMount() {
    this.loadLDAP();
  }

  getInitState() {
    return {
      sidebar: false,
      buttonClicked: false,
      open: false,
      saving: false,
      organizationId: this.props.AppState.currentMenuType.id,
      value: '',
    };
  }

  openSidebar = () => {
    this.setState({
      sidebar: true,
    });
  };

  closeSidebar = () => {
    this.setState({
      sidebar: false,
    });
  };

  /**
   * 刷新函数
   */
  reload = () => {
    this.loadLDAP();
  };

  /**
   * 加载LDAP
   */
  loadLDAP = () => {
    const { LDAPStore } = this.props;
    const { organizationId } = this.state;
    LDAPStore.loadLDAP(organizationId).catch((error) => {
      LDAPStore.cleanData();
      const response = error.response;
      if (response) {
        const status = response.status;
        const mess = response.data.message;
        switch (status) {
          case 400:
            Choerodon.prompt(mess);
            break;
          case 404:
            Choerodon.prompt('Not Found!');
            break;
          default:
            break;
        }
        LDAPStore.setIsLoading(false);
      }
    });
    this.setState({
      saving: false,
    });
  };

  handleSubmit = (e) => {
    e.preventDefault();
    this.props.form.validateFieldsAndScroll((err, values) => {
      if (!err) {
        const { LDAPStore } = this.props;
        const original = LDAPStore.getLDAPData;
        const ldapStatus = values.status;
        const ladp = {
          ...values,
          id: original.id,
          objectVersionNumber: original.objectVersionNumber,
        };
        ladp.status = ldapStatus;
        this.setState({
          saving: true,
          buttonClicked: true,
        });
        LDAPStore.updateLDAP(this.state.organizationId, LDAPStore.getLDAPData.id, ladp)
          .then((data) => {
            if (data) {
              LDAPStore.setLDAPData(data);
              Choerodon.prompt(Choerodon.getMessage('保存成功！', 'update success!'));
            } else {
              Choerodon.prompt(Choerodon.getMessage('保存失败！', 'update failed!'));
            }
            this.setState({
              saving: false,
              buttonClicked: false,
            });
          }).catch((error) => {
            const response = error.response;
            if (response) {
              const status = response.status;
              const mess = response.data.message;
              switch (status) {
                case 400:
                  Choerodon.prompt(mess);
                  break;
                default:
                  break;
              }
            }
            this.setState({
              saving: false,
              buttonClicked: false,
            });
          });
      }
    });
  };

  render() {
    const { LDAPStore } = this.props;
    const { AppState } = this.props;
    const menuType = AppState.currentMenuType;
    const organizationName = menuType.name;
    const organizationId = menuType.id;
    const ldapData = LDAPStore.getLDAPData;
    let type;
    if (AppState.getType) {
      type = AppState.getType;
    } else if (sessionStorage.type) {
      type = sessionStorage.type;
    } else {
      type = menuType.type;
    }


    const { getFieldDecorator } = this.props.form;
    let status = 'N';
    if (ldapData && ldapData.status === 'Y') {
      status = 'Y';
    } else {
      status = 'N';
    }

    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 100 },
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 9 },
      },
    };

    const inputWidth = 512;
    const mainContent = LDAPStore.getIsLoading ? <LoadingBar /> : (<div>
      <Form onSubmit={this.handleSubmit} layout="vertical">
        <FormItem
          {...formItemLayout}
          // label={Choerodon.languageChange('ldap.name')}
          // hasFeedback
        >
          {getFieldDecorator('name', {
            rules: [{
              required: true,
              message: Choerodon.getMessage('名称为必填项', 'Name is required'),
            }],
            initialValue: ldapData ? ldapData.name : '',
          })(
            <Input label={Choerodon.languageChange('ldap.name')} style={{ width: inputWidth }} />,
          )}
        </FormItem>
        <FormItem
          {...formItemLayout}
          // label={Choerodon.languageChange('ldap.serverAddress')}
          // hasFeedback
        >
          {getFieldDecorator('serverAddress', {
            initialValue: ldapData ? ldapData.serverAddress : '',
          })(
            <Input label={Choerodon.languageChange('ldap.serverAddress')} placeholder={Choerodon.languageChange('ldap.serverAddress')} style={{ width: inputWidth }} />,
          )}
        </FormItem>
        <FormItem
          {...formItemLayout}
          // label={Choerodon.languageChange('ldap.ldapAttributeName')}
          // hasFeedback
        >
          {getFieldDecorator('ldapAttributeName', {
            initialValue: ldapData ? ldapData.ldapAttributeName : '',
          })(
            <Input label={Choerodon.languageChange('ldap.ldapAttributeName')} placeholder={Choerodon.languageChange('ldap.ldapAttributeName')} style={{ width: inputWidth }} />,
          )}
        </FormItem>
        <FormItem
          {...formItemLayout}

          // label={Choerodon.languageChange('ldap.encryption')}
          // hasFeedback
        >
          {getFieldDecorator('encryption', {
            initialValue: ldapData.encryption ? ldapData.encryption : undefined,
          })(
            <Select
              label={Choerodon.getMessage('加密方式', 'ldap.encryption')}
              placeholder="请选择一种加密方式"
              style={{ width: inputWidth }}
            >
              <Option value="SSL">SSL</Option>
              <Option value="TSL">TSL</Option>
              <Option value="STARTTLS">STARTTLS</Option>
            </Select>,
          )}
        </FormItem>
        <FormItem
          {...formItemLayout}
          label={Choerodon.languageChange('ldap.baseDn')}
          // hasFeedback
        >
          {getFieldDecorator('baseDn', {
            initialValue: ldapData ? ldapData.baseDn : '',
          })(
            <Input label={Choerodon.languageChange('ldap.baseDn')} placeholder={Choerodon.languageChange('ldap.baseDn')} style={{ width: inputWidth }} />,
          )}
        </FormItem>
        <FormItem
          style={{ width: 512 }}
          {...formItemLayout}
          // label={Choerodon.languageChange('ldap.description')}
        >
          {getFieldDecorator('description', {
            initialValue: ldapData ? ldapData.description : '',
          })(
            <TextArea rows={2} label={Choerodon.languageChange('ldap.description')} placeholder="描述" />,
          )}
        </FormItem>
        <FormItem
          {...formItemLayout}
        >
          {getFieldDecorator('status', {
            initialValue: status,
          })(
            <RadioGroup label="是否启用" className="ldapRadioGroup">
              <Radio value={'Y'}>是</Radio>
              <Radio value={'N'}>否</Radio>
            </RadioGroup>,
          )}
        </FormItem>
        <Permission service={['iam-service.ldap.update']} type={type} organizationId={organizationId}>
          <div className="btnGroup">
            <Button
              text={Choerodon.languageChange('save')}
              htmlType="submit"
              loading={this.state.saving}
              funcType="raised"
              type="primary"
            >保存</Button>
            <Button
              funcType="raised"
              onClick={() => {
                const { resetFields } = this.props.form;
                resetFields();
              }}
            >{Choerodon.languageChange('cancel')}
            </Button>
          </div>
        </Permission>
      </Form>
    </div>);

    return (
      <Page>
        <Header title={Choerodon.getMessage('修改LDAP', 'edit LDAP')}>
          <Permission service={['iam-service.ldap.queryByOrgId']} type={type} organizationId={organizationId}>
            <Button
              onClick={this.reload}
              icon="refresh"
            >
              {Choerodon.languageChange('refresh')}
            </Button>
          </Permission>
        </Header>
        <Content
          title={`组织“${organizationName}”的LDAP`}
          link="http://choerodon.io/zh/docs/user-guide/system-configuration/tenant/ldap/"
          description="LDAP管理是对组织应用的LDAP信息设置的管理。LDAP只针对LDAP用户，LDAP用户的登录名和密码取自LDAP指向的外部系统中的数据。"
        >
          <div className="ldapContainer">
            {mainContent}
          </div>
        </Content>
      </Page>
    );
  }
}

export default Form.create({})(withRouter(LDAP));
