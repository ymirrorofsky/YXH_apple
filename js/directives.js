angular.module('starter.directives', [])

.directive('updateImg',function(){
    return function(scope, element, attrs){
        element.bind('click',function(){
            element[0].src=attrs.src;
        })
    }
})