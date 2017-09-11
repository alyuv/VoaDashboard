<?php

  class PgDb
  {
    private static $instance;
    private $connection;

    private function __construct()
    {
      $cfg = voaConfig::getInstance();
      $this->open_connection($cfg->DB_HOST, $cfg->DB_PORT, $cfg->DB_NAME, $cfg->DB_USER, $cfg->DB_PASS);
    }


    public static function getPgDb()
    {
      if(!isset(self::$instance))
      {
          $c = __CLASS__;
          self::$instance = new $c;
      }
      return self::$instance;
    }


    private function open_connection($host,$port,$db,$usr,$pass) {
      $connstr = "host=$host port=$port dbname=$db user=$usr password=$pass";
      $this->connection = pg_connect($connstr) or die("Could npot connect to PostgreSQL database.<br>Connect starting: $connstr");
      if($this->connection) if(!pg_query($this->connection, "set names 'utf8'")) die("set names utf8 failed");
    }

    public function query($sql)
    {
      try
      {
        $result = @pg_query($this->connection, $sql);
        if (!$result) throw new Exception(pg_last_error($this->connection));
        return $result;
      }
      catch (Exception $e)
      {
        $result = null;
        throw $e;
      }
    }
}
?>