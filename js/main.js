/* Cause fuck centering via css */
(function($){
	$.fn.verticalCenter = function(){
		var element = this;

		$(element).ready(function(){
			changeCss();

			$(window).bind("resize", function(){
				changeCss();
			});

			function changeCss(){
				var elementHeight = element.height();
				var windowHeight = $(window).height();

				if(windowHeight > elementHeight)
				{
					$(element).css({
						"position" : 'absolute',
						"top" : (windowHeight/2 - elementHeight/2) + "px",
						"left" : 0 + "px",
						'width' : '100%'
					});
				}
			};
		});

	};
})(jQuery);

/* Panel */
jQuery(document).ready(function($){
	//open the lateral panel
	$('.cd-btn-about').on('click', function(event){
		event.preventDefault();
		$('.about').addClass('is-visible');
	});
	//clode the lateral panel
	$('.about').on('click', function(event){
		if( $(event.target).is('.about') || $(event.target).is('.cd-panel-close') ) { 
			$('.about').removeClass('is-visible');
			event.preventDefault();
		}
	});
});

/* Panel */
jQuery(document).ready(function($){
	//open the lateral panel
	$('.cd-btn-projects').on('click', function(event){
		event.preventDefault();
		$('.projects').addClass('is-visible');
	});
	//clode the lateral panel
	$('.projects').on('click', function(event){
		if( $(event.target).is('.projects') || $(event.target).is('.cd-panel-close') ) { 
			$('.projects').removeClass('is-visible');
			event.preventDefault();
		}
	});
});

$(window).on('load', function() {
   $("#cover").hide();
});
