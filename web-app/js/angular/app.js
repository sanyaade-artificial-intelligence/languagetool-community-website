'use strict';

var ruleEditor = angular.module('ruleEditor', [
  'ruleEditor.services',
  'ui.sortable',
  'ui.sortable',
  'ruleEditor.directives',
  'ngSanitize'  // show non-escaped HTML
]);

ruleEditor.controller('RuleEditorCtrl', function ($scope, $http, $q, SentenceComparator, XmlBuilder) {

  String.prototype.htmlEscape = function() {
    return $('<div/>').text(this.toString()).html();
  };

  String.prototype.attributeEscape = function() {
    return this.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
  };

  $scope.sortableOptions = {
    handle: '.dragHandle', containment: '#dragContainment', axis: 'y'
  };

  $scope.languageCodes = [
    {code: 'en', name: 'English'},
    {code: 'de', name: 'German'}
  ];
  $scope.languageCode = $scope.languageCodes[0];  // TODO
  $scope.ruleName = "";
  $scope.wrongSentence = "Sorry for my bed English.";  //TODO
  $scope.correctedSentence = "Sorry for my bad English.";
  $scope.ruleMessage = "";

  $scope.patternCreated = false;
  $scope.patternEvaluated = false;
  $scope.patternElements = [];
  $scope.evaluationResult = null;  // HTML with rule matches in Wikipedia/Tatoeba
  
  $scope.wrongSentenceAnalysis = null;
  $scope.patternCreationInProgress = false;
  $scope.patternEvaluationInProgress = false;

  $scope.analyzeWrongSentence = function() {
    var self = this;
    var data = "text=" + this.wrongSentence + "&lang=" + this.languageCode.code;
    this.patternCreationInProgress = true;
    $http({
      url: __ruleEditorSentenceAnalysisUrl,
      method: 'POST',
      data: data,
      // See http://stackoverflow.com/questions/19254029/angularjs-http-post-does-not-send-data:
      headers: {'Content-Type': 'application/x-www-form-urlencoded'}
    }).success(function(data) {
        self.wrongSentenceAnalysis = data;
        self.patternCreationInProgress = false;
      })
      .error(function(data, status, headers, config) {
        self.wrongSentenceAnalysis = data;
        self.patternCreationInProgress = false;
      });
  };

  $scope.hideWrongSentenceAnalysis = function() {
    this.wrongSentenceAnalysis = null;
  };

  $scope.createErrorPattern = function() {
    var self = this;
    this.patternCreationInProgress = true;
    if (this.patternCreated) {
      if (!confirm("Re-create the pattern, overwriting the existing one?")) {
        this.patternCreationInProgress = false;
        return;
      } else {
        this.patternElements = [];
      }
    }
    var incorrectTokensPromise = SentenceComparator.incorrectTokens(__ruleEditorTokenizeSentencesUrl, this.languageCode.code,
        this.wrongSentence, this.correctedSentence);
    incorrectTokensPromise.then(
      function(diffTokens) {
        for (var i = 0; i < diffTokens.length; i++) {
          self.addElement(diffTokens[i]);
        }
        self.patternCreated = true;
        self.patternEvaluated = false;
        self.patternCreationInProgress = false;
      },
      function(data) {
        alert("Could not tokenize example sentences: " + data);
        self.patternCreationInProgress = false;
      },
      function(data) {}
    );
  };

  $scope.addElement = function(tokenValue) {
    this.patternElements.push({'tokenValue': tokenValue, 'tokenType': 'word', regex: false, negation: false});
    this.focusInput = true;
  };

  $scope.elementPosition = function(elem) {
    var position = 0;
    for (var i = 0; i < this.patternElements.length; i++) {
      if (this.patternElements[i].tokenType != 'marker') {
        position++;
      }
      if (elem == this.patternElements[i]) {
        return position;
      }
    }
    return -1;
  };

  $scope.addMarker = function(tokenValue) {
    this.patternElements.unshift({'tokenValue': __LT_MARKER_START, 'tokenType': 'marker'});
    this.patternElements.push({'tokenValue': __LT_MARKER_END, 'tokenType': 'marker'});
  };

  $scope.hasNoMarker = function(tokenValue) {
    for (var i = 0; i < this.patternElements.length; i++) {
      if (this.patternElements[i].tokenType == 'marker') {
        return false;
      }
    }
    return true;
  };

  $scope.removeElement = function(element) {
    var index = this.patternElements.indexOf(element);
    if (this.patternElements[index].tokenType == 'marker') {
      this.removeMarkers();
    } else {
      if (index > -1) {
        this.patternElements.splice(index, 1);
      } else {
        console.warn("No element found: " + element);
      }
    }
  };

  $scope.removeMarkers = function() {
    var idx = -1;
    for (var i = 0; i < this.patternElements.length; i++) {
      if (this.patternElements[i].tokenType == 'marker') {
        this.patternElements.splice(i, 1);
      }
    }
  };
  
  /*$scope.handleReturnForToken = function() {
      // TODO: why won't this show the evaluation result div? (this.patternEvaluated = true;) 
      this.evaluateErrorPattern();
    };*/
  
  $scope.evaluateErrorPattern = function() {
    this.patternEvaluationInProgress = true;
    var data = "language=" + this.languageCode.code + "&checkMarker=false&xml=" + this.buildXml();
    var ctrl = this;
    var url = __ruleEditorEvaluationUrl;  // GSP doesn't evaluate in JS, so we need this hack
    $http({
      url: url,
      method: 'POST',
      data: data,
      // See http://stackoverflow.com/questions/19254029/angularjs-http-post-does-not-send-data:
      headers: {'Content-Type': 'application/x-www-form-urlencoded'}
    }).success(function(data) {
        // TODO: slooooow! see https://github.com/Pasvaz/bindonce
        //ctrl.evaluationResult = data;
        ctrl.patternEvaluated = true;
        $('#evaluationResult').html(data);
        ctrl.patternEvaluated = true;
        ctrl.patternEvaluationInProgress = false;
      })
      .error(function(data, status, headers, config) {
        // TODO: see above:
        $('#evaluationResult').html(data);
        ctrl.patternEvaluationInProgress = false;
      });
    this.patternEvaluated = true;
  };

  $scope.buildXml = function() {
    return XmlBuilder.buildXml(this);
  };

  //$scope.showXml = function() {
  //  alert(this.buildXml());
  //};

});
