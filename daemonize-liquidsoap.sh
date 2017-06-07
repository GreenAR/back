#!/bin/sh

# Generate configuration files to run liquidsoap as daemon.

# Make it work from a symlink:
if readlink ${0} >/dev/null 2>&1; then
  ORIG_DIR=`dirname ${0}`
  TARGET=`readlink ${0}`
  FIRST_CHAR=`echo ${TARGET} | head -c1`
  if [ ${FIRST_CHAR} == "/" ]; then
    SCRIPT_DIR=`dirname ${TARGET}`
  else
    SCRIPT_DIR=`dirname "${ORIG_DIR}/${TARGET}"`
  fi
else
  SCRIPT_DIR=`dirname ${0}`
fi
cd ${SCRIPT_DIR}

base_dir="${HOME}/liquidsoap-daemon"
main_script="${base_dir}/main.liq"
run_script="${base_dir}/run.liq"
pid_dir="${base_dir}/pid"
log_dir="${base_dir}/log"
liquidsoap_binary=`which liquidsoap`

if [ -z "${init_type}" ]; then
    init_type="systemd"
fi;

initd_target="/etc/init.d/liquidsoap-daemon"
launchd_target="${HOME}/Library/LaunchAgents/fm.liquidsoap.daemon.plist"
systemd_target="/etc/systemd/system/liquidsoap.service"

if [ -z "${mode}" ]; then
    mode=install
fi

if [ "${mode}" = "remove" ]; then
    case "${init_type}" in
	systemd)
	    sudo systemctl disable liquidsoap
	    sudo systemctl stop liquidsoap
	    sudo rm "$systemd_target"
	    sudo systemctl daemon-reload
	    ;;
	launchd)
	    launchctl unload "${launchd_target}"
	    ;;
	initd)
	    sudo "${initd_target}" stop
	    sudo update-rc.d -f liquidsoap-daemon remove
	    ;;
    esac
    exit 0
fi

mkdir -p "${pid_dir}"
mkdir -p "${log_dir}"

cat <<EOS > "${run_script}"
#!/bin/env liquidsoap

set("log.file",true)
set("log.file.path","${log_dir}/run.log")
EOS

if [ "${init_type}" != "launchd" ]; then
    cat <<EOS >> "${run_script}"
set("init.daemon",true)
set("init.daemon.change_user",true)
set("init.daemon.change_user.group","${USER}")
set("init.daemon.change_user.user","${USER}")
set("init.daemon.pidfile",true)
set("init.daemon.pidfile.path","${pid_dir}/run.pid")
EOS
fi

echo "%include \"${main_script}\"" >> "${run_script}"

if [ ! -f ${main_script} ]; then
  echo "output.dummy(blank())" >> "${main_script}"
fi

cat "liquidsoap.${init_type}.in" | \
    sed -e "s#@user@#${USER}#g" | \
    sed -e "s#@liquidsoap_binary@#${liquidsoap_binary}#g" | \
    sed -e "s#@base_dir@#${base_dir}#g" | \
    sed -e "s#@run_script@#${run_script}#g" | \
    sed -e "s#@pid_dir@#${pid_dir}#g" > "liquidsoap.${init_type}"

case "${init_type}" in
    launchd)
	cp -f "liquidsoap.${init_type}" "${launchd_target}"
	;;
    initd)
	sudo cp -f "liquidsoap.${init_type}" "${initd_target}"
	sudo chmod +x "${initd_target}"
	sudo update-rc.d liquidsoap-daemon defaults 
	;;
    systemd)
	sudo cp -f "liquidsoap.${init_type}" "${systemd_target}"
	sudo systemctl daemon-reload
esac
