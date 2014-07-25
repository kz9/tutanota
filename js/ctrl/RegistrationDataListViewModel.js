"use strict";

goog.provide('tutao.tutanota.ctrl.RegistrationDataListViewModel');

/**
 * Handles the registration data in Tutanota.
 * @constructor
 */
tutao.tutanota.ctrl.RegistrationDataListViewModel = function(systemInstance) {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
	this.registrationDataList = ko.observableArray();
	this.upperBoundId = ko.observable(tutao.rest.EntityRestInterface.CUSTOM_MIN_ID);
	
	this.company = ko.observable("");
	this.domain = ko.observable("");
	this.accountTypes = [{id: '2', name: 'Starter'}, {id: '1', name: 'Free'}];
    this.language = ko.observable("de");
	this.selectedAccountType = ko.observable("");
	this.groupName = ko.observable("");
	this.mobilePhoneNumber = ko.observable("");
	this.phoneNumber = ko.observable("");
	this.mailAddress = ko.observable("");
	
	this._listId = ko.observable(systemInstance.getRegistrationDataList());
};

tutao.tutanota.ctrl.RegistrationDataListViewModel.prototype.reset = function() {
	this.company("");
	this.domain("");
	this.selectedAccountType("");
	this.groupName("");
	this.mobilePhoneNumber("");
	this.phoneNumber("");
	this.mailAddress("");
};

tutao.tutanota.ctrl.RegistrationDataListViewModel.prototype.getUrl = function(id) {
	return document.location.protocol + "//" + document.location.hostname + ":" + document.location.port + "/#register/" + tutao.rest.ResourceConstants.AUTH_TOKEN_PARAMETER_NAME + "=" + id;
};

tutao.tutanota.ctrl.RegistrationDataListViewModel.prototype.getAccountTypeName = function(typeId) {
	if (typeId == "1") {
		return "Free";
	} else if (typeId == "2") {
		return "Starter";
	} else if (typeId == "3") {
		return "Premium";
	} else if (typeId == "4") {
		return "Stream";
	}
};

tutao.tutanota.ctrl.RegistrationDataListViewModel.prototype.getStateName = function(stateId) {
	if (stateId == "0") {
		return "Initial";
    } else if (stateId == "1") {
		return "CodeSent";
	} else if (stateId == "2") {
		return "CodeVerified";
	} else if (stateId == "3") {
		return "Registered";
	}
};


/**
 * Adds a new registration data entry
 */
tutao.tutanota.ctrl.RegistrationDataListViewModel.prototype.add = function() {
	var regData = new tutao.entity.sys.RegistrationServiceData()
		.setAccountType(this.selectedAccountType())
        .setLanguage(this.language())
		.setCompany(this.company())
		.setDomain(this.domain())
		.setGroupName(this.groupName())
		.setMobilePhoneNumber(this.mobilePhoneNumber())
		.setMailAddress(this.mailAddress())
		.setState(tutao.entity.tutanota.TutanotaConstants.REGISTRATION_STATE_INITIAL);
	var self = this;
	var authToken = regData.setup({}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(registrationReturn) {
        // Workaround as re-loading a range does not work under all circumstances if the id is custom
        tutao.entity.sys.RegistrationData.load([self._listId(),registrationReturn.getAuthToken()]).then(function(element) {
            self.registrationDataList.push(element);
        });
        self.reset();
	});
	return false;
};

/**
 * removes a registration data entry
 */
tutao.tutanota.ctrl.RegistrationDataListViewModel.prototype.remove = function(element) {
	if (tutao.tutanota.gui.confirm("Really delete?")) {
		element.erase(function() {});
		this.registrationDataList.remove(element);
	}
	return false;
};

/**
 * sends the domain verification mail to the requesting user
 */
tutao.tutanota.ctrl.RegistrationDataListViewModel.prototype.sentDomainVerificationMail = function(element) {
    if (tutao.tutanota.gui.confirm("Really send domain verification mail?")) {
        var input = new tutao.entity.sys.RegistrationVerifyDomainDataPut()
            .setAuthToken(element.getId()[1]);
        input.update({}, null, function(ret, exception) {
            if (exception) {
                console.log(exception);
            } else {
                tutao.entity.sys.RegistrationData.load(element.getId(), function(regData, exception) {
                    if (exception) {
                        console.log(exception);
                    } else {
                        element.setDomainVerificationMailSentOn(regData.getDomainVerificationMailSentOn());
                    }
                });
            }
        });
    }
    return false;
};

/**
 * Shows the registration data list.
 */
tutao.tutanota.ctrl.RegistrationDataListViewModel.prototype.showSelected = function() {
	if (!this._listId()) {
		return;
	}
	var self = this;
	this._loadRegistrationDataEntries(this.upperBoundId(), false).then(function(registrationDataList) {
		self.registrationDataList(registrationDataList);
	});
};

/**
 * Loads a maximum of 1000 entries beginning with the entry with a smaller id than upperBoundId 
 * @param {string} upperBoundId The id of upper limit (base64 encoded)
 * @param {boolean} reverse If the entries shall be loaded reverse.
 * @return {Promise.<Array.<tutao.entity.sys.RegistrationData>} Resolves to the list of customers
 */
tutao.tutanota.ctrl.RegistrationDataListViewModel.prototype._loadRegistrationDataEntries = function(upperBoundId, reverse) {
	var self = this;
	return tutao.entity.sys.RegistrationData.loadRange(this._listId(), upperBoundId, 1000, reverse).caught(function (exception) {
        console.log(exception);
    });
};