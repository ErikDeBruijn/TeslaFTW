#include "pebble.h"
#include "splash.h"

// BEGIN AUTO-GENERATED UI CODE; DO NOT MODIFY
static Window *s_window;
static GBitmap *s_res_tesla_logo;
static GFont s_res_bitham_30_black;
static BitmapLayer *tesla_logo;
static TextLayer *s_textlayer_1;

static void initialise_ui(void) {
  s_window = window_create();
  #ifndef PBL_SDK_3
    window_set_fullscreen(s_window, 0);
  #endif
  
  s_res_tesla_logo = gbitmap_create_with_resource(RESOURCE_ID_tesla_logo);
  s_res_bitham_30_black = fonts_get_system_font(FONT_KEY_BITHAM_30_BLACK);
  // tesla_logo
  tesla_logo = bitmap_layer_create(GRect(-7, -7, 160, 160));
  bitmap_layer_set_bitmap(tesla_logo, s_res_tesla_logo);
  layer_add_child(window_get_root_layer(s_window), (Layer *)tesla_logo);
  
  // s_textlayer_1
  s_textlayer_1 = text_layer_create(GRect(-1, 119, 145, 32));
  text_layer_set_text(s_textlayer_1, "FTW!");
  text_layer_set_text_alignment(s_textlayer_1, GTextAlignmentCenter);
  text_layer_set_font(s_textlayer_1, s_res_bitham_30_black);
  layer_add_child(window_get_root_layer(s_window), (Layer *)s_textlayer_1);
}

static void destroy_ui(void) {
  window_destroy(s_window);
  bitmap_layer_destroy(tesla_logo);
  text_layer_destroy(s_textlayer_1);
  gbitmap_destroy(s_res_tesla_logo);
}
// END AUTO-GENERATED UI CODE

static void handle_window_unload(Window* window) {
  destroy_ui();
}

void show_splash(void) {
  initialise_ui();
  window_set_window_handlers(s_window, (WindowHandlers) {
    .unload = handle_window_unload,
  });
  window_stack_push(s_window, true);
}

void hide_splash(void) {
  window_stack_remove(s_window, true);
}
