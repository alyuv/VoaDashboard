<?php

  class voaConfig
  {
    var $APP_PATH;

    var $DB_HOST = 'localhost';

    var $DB_PORT = '5432';

    var $DB_USER = 'u_voa'; // postgresgl user
    var $DB_PASS = 'PassVvoa'; // postgresgl user
    var $DB_NAME = 'voadata';

    private static $instance;

    private function __construct()
    {
      $this->APP_PATH = dirname(__FILE__) ;
      $proto = 'http';
      $port = '';
      if (!empty($_SERVER['HTTPS'])) {
        if ( $_SERVER["HTTPS"] == 'on') {
        $proto = 'https';
          if ($_SERVER["SERVER_PORT"] != 443) $port = ':'.$_SERVER['SERVER_PORT'];
       } else {
          if ($_SERVER["SERVER_PORT"] != 80) $port = ':'.$_SERVER['SERVER_PORT'];
        };
       }
}

    public static function getInstance()
    {
      if (!isset(self::$instance)) { $c = __CLASS__; self::$instance = new $c; }
      return self::$instance;
    }

  }

?>
