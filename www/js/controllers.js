angular.module('starter.controllers', [])
.controller('AppCtrl', function($scope, $ionicModal, $ionicPopup, $ionicPlatform, $ionicScrollDelegate, socket) {
    $scope.ready = true;
    $scope.pseudo = {};
    $scope.users = {};
    $scope.message = {};
    $scope.messages = [];

    $ionicModal.fromTemplateUrl('templates/nickname.html', {
        scope: $scope,
        hardwareBackButtonClose: $scope.pseudo.data ? true : false,
        backdropClickToClose: $scope.pseudo.data ? true : false,
        focusFirstInput: true
    }).then(function(modal) {
        $scope.modal = modal;
    });

    $scope.changeNickname = function() {
        if ($scope.pseudo.data) {
            localStorage.setItem("pseudo", $scope.pseudo.data);
            socket.emit("pseudo", $scope.pseudo.data);
            $scope.modal.hide();
        } else {
            $ionicPopup.alert({
                title: "Empty nickname",
                template: null
            });
        }
    };

    $scope.sendMessage = function() {
        if ($scope.message.data) {
            socket.emit("message", {
                "message": $scope.message.data,
                "token": $scope.token
            });
            $scope.message = {};
        }
    };

    $ionicPlatform.ready(function() {
        $scope.ready = true;
    });

    socket.on("connect", function() {
        if (!localStorage.token) {
            socket.emit("tokenRequest");
        } else {
            $scope.token = localStorage.token;
        }
        socket.on("token", function(data) {
            localStorage.setItem("token", data);
            $scope.token = data;
        });
    });

    socket.on("requestPseudo", function() {
        if (!localStorage.pseudo) {
            $scope.modal.show();
        } else {
            $scope.pseudo.data = localStorage.pseudo;
            socket.emit("pseudo", $scope.pseudo.data);
        }
    });

    socket.on("onlineUsers", function(data) {
        $scope.users = data;
    });

    socket.on("newConnection", function(data) {
        $scope.users[data.id] = data;
        $scope.$apply();
    });

    socket.on("disconnection", function(data) {
        delete $scope.users[data];
        $scope.$apply();
    });

    socket.on("messages", function(data) {
        $scope.messages = data;
        $scope.$apply();
        $ionicScrollDelegate.scrollBottom();
    });

    socket.on("message", function(data) {
        $scope.messages.push(data);
        $scope.$apply();
        $ionicScrollDelegate.scrollBottom(true);
    });
});